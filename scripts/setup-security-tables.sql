-- Security Tables Setup for Document Privacy Protection
-- Run this in your Supabase SQL editor

-- 1. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL DEFAULT 'low',
    details JSONB DEFAULT '{}',
    document_id VARCHAR(255),
    document_classification VARCHAR(20),
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_document_id ON audit_logs(document_id);

-- 2. Retention Policies Table
CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification VARCHAR(20) NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    auto_delete BOOLEAN NOT NULL DEFAULT true,
    archive_before_delete BOOLEAN NOT NULL DEFAULT false,
    notify_before_delete BOOLEAN NOT NULL DEFAULT false,
    notify_days_before INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Document Retention Table
CREATE TABLE IF NOT EXISTS document_retention (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    classification VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    policy_id UUID REFERENCES retention_policies(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notification_sent BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- Index for document retention
CREATE INDEX IF NOT EXISTS idx_document_retention_document_id ON document_retention(document_id);
CREATE INDEX IF NOT EXISTS idx_document_retention_user_id ON document_retention(user_id);
CREATE INDEX IF NOT EXISTS idx_document_retention_expires_at ON document_retention(expires_at);
CREATE INDEX IF NOT EXISTS idx_document_retention_status ON document_retention(status);
CREATE INDEX IF NOT EXISTS idx_document_retention_classification ON document_retention(classification);

-- 4. Update existing demo_requests table to support encryption and classification
ALTER TABLE demo_requests
ADD COLUMN IF NOT EXISTS encrypted_document TEXT,
ADD COLUMN IF NOT EXISTS encryption_iv VARCHAR(32),
ADD COLUMN IF NOT EXISTS encryption_auth_tag VARCHAR(32),
ADD COLUMN IF NOT EXISTS document_classification VARCHAR(20) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Index for demo_requests security fields
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_by ON demo_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_demo_requests_classification ON demo_requests(document_classification);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at);

-- 5. Row Level Security (RLS) Policies

-- Enable RLS on sensitive tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_retention ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Audit logs: Only admins can read, system can write
CREATE POLICY "audit_logs_admin_read" ON audit_logs
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "audit_logs_system_write" ON audit_logs
    FOR INSERT
    WITH CHECK (true); -- Allow system to write audit logs

-- Document retention: Users can only see their own documents
CREATE POLICY "document_retention_user_access" ON document_retention
    FOR ALL
    USING (user_id = auth.uid()::text);

-- Demo requests: Users can only access their own documents
CREATE POLICY "demo_requests_user_access" ON demo_requests
    FOR ALL
    USING (created_by = auth.uid()::text);

-- 6. Insert default retention policies
INSERT INTO retention_policies (classification, retention_days, auto_delete, archive_before_delete, notify_before_delete, notify_days_before)
VALUES
    ('public', 365, true, false, false, 7),
    ('internal', 180, true, true, true, 14),
    ('confidential', 90, true, true, true, 30),
    ('restricted', 30, false, true, true, 7)
ON CONFLICT (classification) DO UPDATE SET
    retention_days = EXCLUDED.retention_days,
    auto_delete = EXCLUDED.auto_delete,
    archive_before_delete = EXCLUDED.archive_before_delete,
    notify_before_delete = EXCLUDED.notify_before_delete,
    notify_days_before = EXCLUDED.notify_days_before,
    updated_at = NOW();

-- 7. Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for retention_policies
CREATE TRIGGER update_retention_policies_updated_at
    BEFORE UPDATE ON retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 8. Create function to cleanup expired data (for cron jobs)
CREATE OR REPLACE FUNCTION cleanup_expired_documents()
RETURNS TABLE(
    documents_processed INTEGER,
    documents_deleted INTEGER,
    errors TEXT[]
) AS $$
DECLARE
    processed_count INTEGER := 0;
    deleted_count INTEGER := 0;
    error_list TEXT[] := ARRAY[]::TEXT[];
    retention_record RECORD;
BEGIN
    -- Process expired documents
    FOR retention_record IN
        SELECT dr.*, rp.auto_delete, rp.archive_before_delete
        FROM document_retention dr
        JOIN retention_policies rp ON dr.policy_id = rp.id
        WHERE dr.expires_at <= NOW() AND dr.status = 'active'
    LOOP
        BEGIN
            processed_count := processed_count + 1;

            IF retention_record.auto_delete THEN
                -- Archive if required
                IF retention_record.archive_before_delete THEN
                    UPDATE document_retention
                    SET status = 'archived', metadata = metadata || jsonb_build_object('archived_at', NOW())
                    WHERE id = retention_record.id;
                END IF;

                -- Delete the document
                DELETE FROM demo_requests WHERE id = retention_record.document_id;

                -- Update retention status
                UPDATE document_retention
                SET status = 'deleted', metadata = metadata || jsonb_build_object('deleted_at', NOW())
                WHERE id = retention_record.id;

                deleted_count := deleted_count + 1;
            ELSE
                -- Mark for manual deletion
                UPDATE document_retention
                SET status = 'pending_deletion', metadata = metadata || jsonb_build_object('marked_for_deletion_at', NOW())
                WHERE id = retention_record.id;
            END IF;

        EXCEPTION
            WHEN OTHERS THEN
                error_list := array_append(error_list, 'Error processing document ' || retention_record.document_id || ': ' || SQLERRM);
        END;
    END LOOP;

    RETURN QUERY SELECT processed_count, deleted_count, error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON retention_policies TO authenticated;
GRANT ALL ON document_retention TO authenticated;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Stores security audit trail for all document operations';
COMMENT ON TABLE retention_policies IS 'Defines data retention policies for different document classifications';
COMMENT ON TABLE document_retention IS 'Tracks document lifecycle and deletion schedules';
COMMENT ON FUNCTION cleanup_expired_documents() IS 'Automated function to process expired documents according to retention policies';