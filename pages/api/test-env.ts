import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check which environment variables are available
  const envCheck = {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    CLERK_SECRET: !!process.env.CLERK_SECRET_KEY,
    NODE_VERSION: process.version,
    DEPLOYMENT_ENV: process.env.VERCEL_ENV || 'local'
  };

  return res.status(200).json({
    message: 'Environment check',
    available: envCheck,
    missingCritical: [
      !process.env.GEMINI_API_KEY && 'GEMINI_API_KEY',
      !process.env.NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
      !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY'
    ].filter(Boolean)
  });
}