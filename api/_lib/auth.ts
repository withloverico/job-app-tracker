import { createClient } from '@supabase/supabase-js'

export async function verifyAuth(req: { headers: Record<string, string | string[] | undefined> }) {
  const authHeader = req.headers.authorization
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing authorization header' }
  }

  const token = authHeader.slice(7)
  const supabase = getServiceSupabase()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  return { user: data.user, error: null }
}

export function getServiceSupabase() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase env vars')
  }
  return createClient(url, key)
}
