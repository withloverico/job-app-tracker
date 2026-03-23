import { supabase } from './supabase'
import type { Application, ParsedJob, Status, StatusHistoryEntry } from '../types'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function parseJob(
  input: { url: string } | { text: string }
): Promise<{ data?: ParsedJob; error?: string; fallback?: boolean }> {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/parse-job', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  return res.json()
}

export async function fetchApplications(params?: {
  status?: string
  search?: string
}): Promise<Application[]> {
  const headers = await getAuthHeaders()
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.search) query.set('search', params.search)
  const res = await fetch(`/api/applications?${query}`, { headers })
  if (res.status === 401) throw new Error('Unauthorized')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

export async function createApplication(
  app: Partial<Application>
): Promise<Application> {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers,
    body: JSON.stringify(app),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

export async function updateApplication(
  id: string,
  updates: Partial<Application>
): Promise<Application> {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

export async function fetchStatusHistory(applicationId: string): Promise<StatusHistoryEntry[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/applications/${applicationId}/status-history`, { headers })
  if (res.status === 401) throw new Error('Unauthorized')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

export async function changeApplicationStatus(
  applicationId: string,
  newStatus: Status,
  note?: string
): Promise<{ application: Application; historyEntry: StatusHistoryEntry }> {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/applications/${applicationId}/status-history`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ new_status: newStatus, note: note || null }),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

export async function deleteApplication(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/applications/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (res.status === 401) throw new Error('Unauthorized')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
}
