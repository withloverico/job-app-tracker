import { useState, useEffect, useCallback } from 'react'
import type { Application, Status } from '../types'
import { fetchApplications, createApplication, updateApplication, deleteApplication, changeApplicationStatus } from '../lib/api'
import toast from 'react-hot-toast'

const MOCK_APPS: Application[] = [
  {
    id: 'mock-1',
    user_id: 'mock',
    created_at: '2026-03-20T10:00:00Z',
    job_url: 'https://example.com/jobs/frontend-engineer',
    company_name: 'Vercel',
    job_title: 'Senior Frontend Engineer',
    location: 'San Francisco, CA',
    is_remote: true,
    salary_min: 180000,
    salary_max: 240000,
    salary_currency: 'USD',
    salary_type: 'annual',
    required_skills: ['React', 'TypeScript', 'Next.js', 'CSS', 'Node.js'],
    nice_to_have_skills: ['GraphQL', 'Figma', 'Tailwind CSS', 'Playwright'],
    application_deadline: '2026-04-15',
    job_summary: 'Build and maintain the Next.js dashboard experience. Work closely with design and product teams to ship polished, performant UI.',
    status: 'Bookmarked',
    notes: 'Referred by a friend on the infra team. Prepare system design examples.',
    date_applied: null,
    follow_up_date: null,
    date_posted: '2026-03-18',
  },
  {
    id: 'mock-2',
    user_id: 'mock',
    created_at: '2026-03-19T08:00:00Z',
    job_url: 'https://example.com/jobs/fullstack',
    company_name: 'Stripe',
    job_title: 'Full Stack Engineer, Payments',
    location: 'Seattle, WA',
    is_remote: false,
    salary_min: 190000,
    salary_max: 260000,
    salary_currency: 'USD',
    salary_type: 'annual',
    required_skills: ['Ruby', 'React', 'PostgreSQL', 'API Design'],
    nice_to_have_skills: ['Go', 'Kafka', 'AWS'],
    application_deadline: null,
    job_summary: 'Design and build APIs powering global payment infrastructure. Collaborate across teams to improve reliability and developer experience.',
    status: 'Applied',
    notes: null,
    date_applied: '2026-03-19',
    follow_up_date: '2026-03-26',
    date_posted: '2026-03-10',
  },
  {
    id: 'mock-3',
    user_id: 'mock',
    created_at: '2026-03-15T14:00:00Z',
    job_url: null,
    company_name: 'Anthropic',
    job_title: 'Product Engineer',
    location: 'San Francisco, CA',
    is_remote: true,
    salary_min: 200000,
    salary_max: 280000,
    salary_currency: 'USD',
    salary_type: 'annual',
    required_skills: ['Python', 'TypeScript', 'React', 'LLMs', 'System Design'],
    nice_to_have_skills: ['Rust', 'ML Infrastructure', 'WebSockets'],
    application_deadline: '2026-04-01',
    job_summary: 'Build user-facing AI products from concept to launch. Requires strong full-stack skills and a passion for AI safety.',
    status: 'Interview',
    notes: 'Phone screen went well. Technical round scheduled for March 28.',
    date_applied: '2026-03-16',
    follow_up_date: '2026-03-28',
    date_posted: '2026-03-05',
  },
]

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPS)
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

  const changeStatus = async (id: string, newStatus: Status, note?: string) => {
    try {
      const result = await changeApplicationStatus(id, newStatus, note)
      setApplications(prev => prev.map(a => (a.id === id ? result.application : a)))
      toast.success('Status updated')
      return result
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        window.location.href = '/login'
        return
      }
      toast.error('Failed to update status')
    }
  }

  return { applications, loading, filters, setFilters, reload: load, add, update, remove, changeStatus }
}
