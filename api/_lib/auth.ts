import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

let supabase: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(`Missing env vars: VITE_SUPABASE_URL=${!!url}, SUPABASE_SERVICE_ROLE_KEY=${!!key}`)
    }
    supabase = createClient(url, key)
  }
  return supabase
}

export async function verifyAuth(req: VercelRequest) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing authorization header' }
  }

  const token = authHeader.slice(7)
  const client = getClient()
  const { data, error } = await client.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  return { user: data.user, error: null }
}

export function getServiceSupabase() {
  return getClient()
}
