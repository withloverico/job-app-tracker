import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth, getServiceSupabase } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, error: authError } = await verifyAuth(req)
  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing application ID' })
  }

  const supabase = getServiceSupabase()

  // Verify ownership
  const { data: existing } = await supabase
    .from('applications')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return res.status(404).json({ error: 'Application not found' })
  }

  if (req.method === 'PATCH') {
    const body = req.body
    // Prevent changing user_id or id
    delete body.id
    delete body.user_id
    delete body.created_at

    const { data, error } = await supabase
      .from('applications')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
