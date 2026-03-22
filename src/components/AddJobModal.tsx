import { useState, useEffect, type FormEvent } from 'react'
import { X, Loader2, AlertTriangle, Link as LinkIcon } from 'lucide-react'
import type { Application, Status, ParsedJob } from '../types'
import { parseJob } from '../lib/api'
import { findDuplicate, type DuplicateMatch } from '../lib/duplicates'
import StatusSelect from './StatusSelect'
import SkillInput from './SkillInput'

interface AddJobModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Application>) => Promise<Application | undefined>
  editingApp?: Application | null
  applications: Application[]
}

export default function AddJobModal({
  open,
  onClose,
  onSave,
  editingApp,
  applications,
}: AddJobModalProps) {
  const [url, setUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [fallbackText, setFallbackText] = useState('')
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null)
  const [saving, setSaving] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('USD')
  const [salaryType, setSalaryType] = useState('annual')
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([])
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [jobSummary, setJobSummary] = useState('')
  const [status, setStatus] = useState<Status>('Bookmarked')
  const [notes, setNotes] = useState('')
  const [dateApplied, setDateApplied] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  useEffect(() => {
    if (editingApp) {
      setUrl(editingApp.job_url || '')
      setCompanyName(editingApp.company_name)
      setJobTitle(editingApp.job_title)
      setLocation(editingApp.location || '')
      setIsRemote(editingApp.is_remote)
      setSalaryMin(editingApp.salary_min?.toString() || '')
      setSalaryMax(editingApp.salary_max?.toString() || '')
      setSalaryCurrency(editingApp.salary_currency || 'USD')
      setSalaryType(editingApp.salary_type || 'annual')
      setRequiredSkills(editingApp.required_skills || [])
      setNiceToHaveSkills(editingApp.nice_to_have_skills || [])
      setApplicationDeadline(editingApp.application_deadline || '')
      setJobSummary(editingApp.job_summary || '')
      setStatus(editingApp.status)
      setNotes(editingApp.notes || '')
      setDateApplied(editingApp.date_applied || '')
      setFollowUpDate(editingApp.follow_up_date || '')
      setDuplicate(null)
    } else {
      resetForm()
    }
  }, [editingApp, open])

  function resetForm() {
    setUrl('')
    setCompanyName('')
    setJobTitle('')
    setLocation('')
    setIsRemote(false)
    setSalaryMin('')
    setSalaryMax('')
    setSalaryCurrency('USD')
    setSalaryType('annual')
    setRequiredSkills([])
    setNiceToHaveSkills([])
    setApplicationDeadline('')
    setJobSummary('')
    setStatus('Bookmarked')
    setNotes('')
    setDateApplied('')
    setFollowUpDate('')
    setShowFallback(false)
    setFallbackText('')
    setDuplicate(null)
    setParsing(false)
  }

  function applyParsedData(data: ParsedJob) {
    if (data.company_name) setCompanyName(data.company_name)
    if (data.job_title) setJobTitle(data.job_title)
    if (data.location) setLocation(data.location)
    if (data.is_remote !== null) setIsRemote(data.is_remote)
    if (data.salary_min !== null) setSalaryMin(data.salary_min.toString())
    if (data.salary_max !== null) setSalaryMax(data.salary_max.toString())
    if (data.salary_currency) setSalaryCurrency(data.salary_currency)
    if (data.salary_type) setSalaryType(data.salary_type)
    if (data.required_skills) setRequiredSkills(data.required_skills)
    if (data.nice_to_have_skills) setNiceToHaveSkills(data.nice_to_have_skills)
    if (data.application_deadline) setApplicationDeadline(data.application_deadline)
    if (data.job_summary) setJobSummary(data.job_summary)

    const match = findDuplicate(
      applications,
      url || null,
      data.company_name,
      data.job_title
    )
    setDuplicate(match)
  }

  async function handleParse() {
    setParsing(true)
    setShowFallback(false)
    try {
      const result = await parseJob({ url })
      if (result.error || result.fallback) {
        setShowFallback(true)
      } else if (result.data) {
        applyParsedData(result.data)
      }
    } catch {
      setShowFallback(true)
    } finally {
      setParsing(false)
    }
  }

  async function handleParseFallback() {
    if (!fallbackText.trim()) return
    setParsing(true)
    try {
      const result = await parseJob({ text: fallbackText })
      if (result.data) {
        applyParsedData(result.data)
      }
    } catch {
      // Fields will remain blank
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!companyName.trim() || !jobTitle.trim()) return

    setSaving(true)
    const data: Partial<Application> = {
      job_url: url || null,
      company_name: companyName.trim(),
      job_title: jobTitle.trim(),
      location: location || null,
      is_remote: isRemote,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      salary_max: salaryMax ? parseInt(salaryMax) : null,
      salary_currency: salaryMin || salaryMax ? salaryCurrency : null,
      salary_type: salaryMin || salaryMax ? salaryType : null,
      required_skills: requiredSkills,
      nice_to_have_skills: niceToHaveSkills,
      application_deadline: applicationDeadline || null,
      job_summary: jobSummary || null,
      status,
      notes: notes || null,
      date_applied: dateApplied || null,
      follow_up_date: followUpDate || null,
    }

    const result = await onSave(data)
    setSaving(false)
    if (result) {
      onClose()
    }
  }

  if (!open) return null

  const daysAgo = duplicate
    ? Math.floor(
        (Date.now() - new Date(duplicate.application.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl mb-8">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {editingApp ? 'Edit Application' : 'Add Application'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!editingApp && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Job Posting URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!url || parsing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Parse Job'
                  )}
                </button>
              </div>
            </div>
          )}

          {showFallback && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-sm text-amber-300 mb-2">
                This site blocked auto-fill. Paste the job description below instead.
              </p>
              <textarea
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                rows={4}
                placeholder="Paste job description here..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
              />
              <button
                type="button"
                onClick={handleParseFallback}
                disabled={!fallbackText.trim() || parsing}
                className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Extract Fields'
                )}
              </button>
            </div>
          )}

          {duplicate && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-300">
                <p>
                  Looks like you may have already added this role at{' '}
                  <strong>{duplicate.application.company_name}</strong> —{' '}
                  <strong>{duplicate.application.job_title}</strong>. Added{' '}
                  {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`} with
                  status <strong>{duplicate.application.status}</strong>.
                </p>
                <a
                  href={`/job/${duplicate.application.id}`}
                  className="text-indigo-400 hover:text-indigo-300 underline mt-1 inline-block"
                >
                  View existing entry
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-300">Remote position</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Salary Min</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder={salaryType === 'hourly' ? '25' : '80000'}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Salary Max</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder={salaryType === 'hourly' ? '50' : '120000'}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Currency</label>
              <input
                type="text"
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Pay Type</label>
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
                className="w-full appearance-none bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="annual">Annual</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          <SkillInput
            label="Required Skills"
            skills={requiredSkills}
            onChange={setRequiredSkills}
            variant="required"
          />
          <SkillInput
            label="Nice-to-Have Skills"
            skills={niceToHaveSkills}
            onChange={setNiceToHaveSkills}
            variant="nice"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Job Summary</label>
            <textarea
              value={jobSummary}
              onChange={(e) => setJobSummary(e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <StatusSelect value={status} onChange={setStatus} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date Applied</label>
              <input
                type="date"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Application Deadline
            </label>
            <input
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this application..."
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !companyName.trim() || !jobTitle.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingApp ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
