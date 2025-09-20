CREATE TABLE public.demo_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_input text NULL,
  ai_result jsonb NULL,
  CONSTRAINT demo_requests_pkey PRIMARY KEY (id)
);
