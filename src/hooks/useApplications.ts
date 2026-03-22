import { useState, useEffect, useCallback } from 'react'
import type { Application } from '../types'
import { fetchApplications, createApplication, updateApplication, deleteApplication } from '../lib/api'
import toast from 'react-hot-toast'

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{ status?: string; search?: string }>({})

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchApplications(filters)
      setApplications(data)
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        window.location.href = '/login'
        return
      }
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  const add = async (app: Partial<Application>) => {
    try {
      const created = await createApplication(app)
      setApplications(prev => [created, ...prev])
      toast.success('Application saved')
      return created
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        window.location.href = '/login'
        return
      }
      toast.error('Failed to save application')
    }
  }

  const update = async (id: string, updates: Partial<Application>) => {
    try {
      const updated = await updateApplication(id, updates)
      setApplications(prev => prev.map(a => (a.id === id ? updated : a)))
      toast.success('Application updated')
      return updated
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        window.location.href = '/login'
        return
      }
      toast.error('Failed to update application')
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteApplication(id)
      setApplications(prev => prev.filter(a => a.id !== id))
      toast.success('Application deleted')
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        window.location.href = '/login'
        return
      }
      toast.error('Failed to delete application')
    }
  }

  return { applications, loading, filters, setFilters, reload: load, add, update, remove }
}
