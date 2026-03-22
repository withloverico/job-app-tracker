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
  const isHourly = app.salary_type === 'hourly'
  const suffix = isHourly ? '/hr' : '/yr'
  const fmt = (n: number) => n.toLocaleString()
  if (app.salary_min && app.salary_max) return `${c} ${fmt(app.salary_min)} – ${fmt(app.salary_max)}${suffix}`
  if (app.salary_min) return `${c} ${fmt(app.salary_min)}+${suffix}`
  return `Up to ${c} ${fmt(app.salary_max!)}${suffix}`
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

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
      <div className="min-h-dvh">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        </div>
      </div>
    )
  }

  if (!app) return null

  const salary = formatSalaryRange(app)
  const editInputClass = "frost-input text-stone-800 rounded-lg px-3 py-1 w-full"

  return (
    <div className="min-h-dvh">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        {/* Header card */}
        <div className="frost rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {editingField === 'job_title' ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  className={`text-2xl font-bold ${editInputClass}`}
                />
              ) : (
                <h1
                  onClick={() => startEdit('job_title', app.job_title)}
                  className="text-2xl font-bold text-stone-800 cursor-pointer hover:text-amber-800 transition-colors"
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
                  className={`text-lg mt-1 ${editInputClass}`}
                />
              ) : (
                <p
                  onClick={() => startEdit('company_name', app.company_name)}
                  className="text-lg text-stone-500 cursor-pointer hover:text-stone-700 transition-colors mt-1"
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

          <div className="flex flex-wrap gap-3 text-sm text-stone-500">
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
                    className={`text-sm ${editInputClass}`}
                    style={{ width: '200px' }}
                  />
                ) : (
                  <span
                    onClick={() => startEdit('location', app.location || '')}
                    className="cursor-pointer hover:text-stone-700"
                  >
                    {app.location}
                    {app.is_remote && <span className="text-emerald-600 ml-1">(Remote)</span>}
                  </span>
                )}
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-1.5 text-emerald-700">
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
                className="flex items-center gap-1.5 text-amber-700 hover:text-amber-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Posting
              </a>
            )}
          </div>
        </div>

        {/* Summary */}
        {app.job_summary && (
          <div className="frost rounded-2xl p-6 mb-4 shadow-sm">
            <h2 className="text-sm font-medium text-stone-600 mb-2">Summary</h2>
            <p className="text-stone-600 text-sm leading-relaxed">{app.job_summary}</p>
          </div>
        )}

        {/* Skills */}
        {(app.required_skills.length > 0 || app.nice_to_have_skills.length > 0) && (
          <div className="frost rounded-2xl p-6 mb-4 shadow-sm">
            {app.required_skills.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-medium text-stone-600 mb-2">Required Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {app.required_skills.map((skill) => (
                    <SkillChip key={skill} skill={skill} variant="required" />
                  ))}
                </div>
              </div>
            )}
            {app.nice_to_have_skills.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-stone-600 mb-2">Nice to Have</h2>
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
        <div className="frost rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-sm font-medium text-stone-600 mb-3">Dates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-stone-400">Added</span>
              <p className="text-stone-700">{new Date(app.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-stone-400">Date Applied</span>
              <p className="text-stone-700">
                {app.date_applied ? new Date(app.date_applied).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <span className="text-stone-400">Follow-up</span>
              <p className="text-stone-700">
                {app.follow_up_date ? new Date(app.follow_up_date).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="frost rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-stone-600 mb-2">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={6}
            placeholder="Add your notes here... (auto-saves after 2 seconds)"
            className="w-full frost-input text-stone-700 rounded-lg px-3 py-2 text-sm placeholder:text-stone-400 resize-none"
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
