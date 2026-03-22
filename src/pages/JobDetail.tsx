import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
} from 'lucide-react'
import type { Application, Status } from '../types'
import { fetchApplications, updateApplication, deleteApplication } from '../lib/api'
import Header from '../components/Header'
import StatusSelect from '../components/StatusSelect'
import SkillChip from '../components/SkillChip'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

function formatSalaryRange(app: Application): string | null {
  if (!app.salary_min && !app.salary_max) return null
  const c = app.salary_currency || 'USD'
  const fmt = (n: number) => n.toLocaleString()
  if (app.salary_min && app.salary_max) return `${c} ${fmt(app.salary_min)} – ${fmt(app.salary_max)}`
  if (app.salary_min) return `${c} ${fmt(app.salary_min)}+`
  return `Up to ${c} ${fmt(app.salary_max!)}`
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Notes auto-save
  const [notes, setNotes] = useState('')
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const apps = await fetchApplications()
        const found = apps.find((a) => a.id === id)
        if (!found) {
          navigate('/', { replace: true })
          return
        }
        setApp(found)
        setNotes(found.notes || '')
      } catch {
        navigate('/', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (!app) return
      try {
        const updated = await updateApplication(app.id, { [field]: value } as Partial<Application>)
        setApp(updated)
        toast.success('Updated')
      } catch {
        toast.error('Failed to update')
      }
    },
    [app]
  )

  const handleNotesChange = (value: string) => {
    setNotes(value)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => {
      saveField('notes', value || null)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current)
    }
  }, [])

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const commitEdit = async () => {
    if (!editingField || !app) return
    const newValue = editValue.trim() || null
    const currentValue = (app as unknown as Record<string, unknown>)[editingField]
    if (newValue !== currentValue) {
      await saveField(editingField, newValue)
    }
    setEditingField(null)
  }

  const handleStatusChange = async (status: Status) => {
    await saveField('status', status)
  }

  const handleDelete = async () => {
    if (!app) return
    try {
      await deleteApplication(app.id)
      toast.success('Application deleted')
      navigate('/', { replace: true })
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-900">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      </div>
    )
  }

  if (!app) return null

  const salary = formatSalaryRange(app)

  return (
    <div className="min-h-dvh bg-slate-900">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        {/* Status + header */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {editingField === 'job_title' ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  className="text-2xl font-bold text-white bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <h1
                  onClick={() => startEdit('job_title', app.job_title)}
                  className="text-2xl font-bold text-white cursor-pointer hover:text-indigo-300 transition-colors"
                >
                  {app.job_title}
                </h1>
              )}

              {editingField === 'company_name' ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  className="text-lg text-slate-300 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p
                  onClick={() => startEdit('company_name', app.company_name)}
                  className="text-lg text-slate-400 cursor-pointer hover:text-slate-200 transition-colors mt-1"
                >
                  {app.company_name}
                </p>
              )}
            </div>

            <StatusSelect
              value={app.status}
              onChange={handleStatusChange}
              className="w-full sm:w-48 flex-shrink-0"
            />
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            {(app.location || app.is_remote) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {editingField === 'location' ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <span
                    onClick={() => startEdit('location', app.location || '')}
                    className="cursor-pointer hover:text-slate-200"
                  >
                    {app.location}
                    {app.is_remote && <span className="text-emerald-400 ml-1">(Remote)</span>}
                  </span>
                )}
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                {salary}
              </div>
            )}
            {app.application_deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Deadline: {new Date(app.application_deadline).toLocaleDateString()}
              </div>
            )}
            {app.job_url && (
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Posting
              </a>
            )}
          </div>
        </div>

        {/* Summary */}
        {app.job_summary && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-300 mb-2">Summary</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{app.job_summary}</p>
          </div>
        )}

        {/* Skills */}
        {(app.required_skills.length > 0 || app.nice_to_have_skills.length > 0) && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            {app.required_skills.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-medium text-slate-300 mb-2">Required Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {app.required_skills.map((skill) => (
                    <SkillChip key={skill} skill={skill} variant="required" />
                  ))}
                </div>
              </div>
            )}
            {app.nice_to_have_skills.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-slate-300 mb-2">Nice to Have</h2>
                <div className="flex flex-wrap gap-1.5">
                  {app.nice_to_have_skills.map((skill) => (
                    <SkillChip key={skill} skill={skill} variant="nice" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Dates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Added</span>
              <p className="text-slate-300">{new Date(app.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-slate-500">Date Applied</span>
              <p className="text-slate-300">
                {app.date_applied
                  ? new Date(app.date_applied).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Follow-up</span>
              <p className="text-slate-300">
                {app.follow_up_date
                  ? new Date(app.follow_up_date).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium text-slate-300 mb-2">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={6}
            placeholder="Add your notes here... (auto-saves after 2 seconds)"
            className="w-full bg-slate-700/50 border border-slate-600/50 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
          />
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Application"
        message={`Are you sure you want to delete your application for ${app.job_title} at ${app.company_name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
