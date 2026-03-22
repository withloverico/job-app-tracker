import { verifyAuth, getServiceSupabase } from '../_lib/auth.js'

export default async function handler(req: any, res: any) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return res.status(401).json({ error: authError || 'Unauthorized' })
    }

    const supabase = getServiceSupabase()

    if (req.method === 'GET') {
      const { status, search } = req.query

      let query = supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (status && typeof status === 'string') {
        query = query.eq('status', status)
      }

      if (search && typeof search === 'string') {
        query = query.or(
          `company_name.ilike.%${search}%,job_title.ilike.%${search}%`
        )
      }

      const { data, error } = await query
      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      const body = req.body
      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...body,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({ data })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('Function error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
