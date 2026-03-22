import { createClient } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifyAuth(req: VercelRequest) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing authorization header' }
  }

  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  return { user: data.user, error: null }
}

export function getServiceSupabase() {
  return supabase
}
