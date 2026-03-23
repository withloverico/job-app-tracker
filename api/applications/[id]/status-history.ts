import { verifyAuth, getServiceSupabase } from '../../_lib/auth.js'

export default async function handler(req: any, res: any) {
  try {
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
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return res.status(404).json({ error: 'Application not found' })
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('status_history')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: true })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data: data || [] })
    }

    if (req.method === 'POST') {
      const { new_status, note } = req.body || {}
      if (!new_status) {
        return res.status(400).json({ error: 'new_status is required' })
      }

      const old_status = existing.status

      // Insert history entry
      const { data: historyEntry, error: historyError } = await supabase
        .from('status_history')
        .insert({
          application_id: id,
          user_id: user.id,
          old_status,
          new_status,
          note: note || null,
        })
        .select()
        .single()

      if (historyError) {
        return res.status(500).json({ error: historyError.message })
      }

      // Update the application status
      const { data: updatedApp, error: updateError } = await supabase
        .from('applications')
        .update({ status: new_status })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        return res.status(500).json({ error: updateError.message })
      }

      return res.status(200).json({ data: { application: updatedApp, historyEntry } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('Function error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
