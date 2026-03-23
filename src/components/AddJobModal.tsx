import { useState, useEffect, type FormEvent } from 'react'
import { X, Loader2, AlertTriangle, Link as LinkIcon } from 'lucide-react'
import type { Application, Status, ParsedJob } from '../types'
import { parseJob } from '../lib/api'
import { findDuplicate, type DuplicateMatch } from '../lib/duplicates'
import StatusSelect from './StatusSelect'
import CustomSelect from './CustomSelect'
import DatePicker from './DatePicker'
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
  const [equity, setEquity] = useState('')
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([])
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [jobSummary, setJobSummary] = useState('')
  const [status, setStatus] = useState<Status>('Bookmarked')
  const [notes, setNotes] = useState('')
  const [dateApplied, setDateApplied] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [datePosted, setDatePosted] = useState('')

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
      setEquity(editingApp.equity || '')
      setRequiredSkills(editingApp.required_skills || [])
      setNiceToHaveSkills(editingApp.nice_to_have_skills || [])
      setApplicationDeadline(editingApp.application_deadline || '')
      setJobSummary(editingApp.job_summary || '')
      setStatus(editingApp.status)
      setNotes(editingApp.notes || '')
      setDateApplied(editingApp.date_applied || '')
      setFollowUpDate(editingApp.follow_up_date || '')
      setDatePosted(editingApp.date_posted || '')
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
    setEquity('')
    setRequiredSkills([])
    setNiceToHaveSkills([])
    setApplicationDeadline('')
    setJobSummary('')
    setStatus('Bookmarked')
    setNotes('')
    setDateApplied('')
    setFollowUpDate('')
    setDatePosted('')
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
    if (data.date_posted) setDatePosted(data.date_posted)
    if (data.job_summary) setJobSummary(data.job_summary)
    if (data.equity) setEquity(data.equity)

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
      equity: equity || null,
      required_skills: requiredSkills,
      nice_to_have_skills: niceToHaveSkills,
      application_deadline: applicationDeadline || null,
      job_summary: jobSummary || null,
      status,
      notes: notes || null,
      date_applied: dateApplied || null,
      follow_up_date: followUpDate || null,
      date_posted: datePosted || null,
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

  const inputClass = "w-full frost-input text-stone-800 rounded-lg px-3 py-2 text-sm placeholder:text-stone-400"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 sm:pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative frost-strong sm:rounded-2xl w-full max-w-2xl shadow-xl min-h-dvh sm:min-h-0 sm:mb-8">
        <div className="flex items-center justify-between p-4 border-b border-stone-200/50">
          <h2 className="text-lg font-semibold text-stone-800">
            {editingApp ? 'Edit Application' : 'Add Application'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!editingApp && (
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Job Posting URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className={`${inputClass} !pl-9`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!url || parsing}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
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
            <div className="bg-amber-50/80 border border-amber-300/50 rounded-lg p-3">
              <p className="text-sm text-amber-800 mb-2">
                This site blocked auto-fill. Paste the job description below instead.
              </p>
              <textarea
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                rows={4}
                placeholder="Paste job description here..."
                className={`${inputClass} resize-none`}
              />
              <button
                type="button"
                onClick={handleParseFallback}
                disabled={!fallbackText.trim() || parsing}
                className="mt-2 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
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
            <div className="bg-amber-50/80 border border-amber-300/50 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p>
                  Looks like you may have already added this role at{' '}
                  <strong>{duplicate.application.company_name}</strong> —{' '}
                  <strong>{duplicate.application.job_title}</strong>. Added{' '}
                  {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`} with
                  status <strong>{duplicate.application.status}</strong>.
                </p>
                <a
                  href={`/job/${duplicate.application.id}`}
                  className="text-amber-700 hover:text-amber-900 underline mt-1 inline-block"
                >
                  View existing entry
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Company Name *</label>
              <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Job Title *</label>
              <input type="text" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" className={inputClass} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-600"
                />
                <span className="text-sm text-stone-600">Remote position</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Salary Min</label>
              <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder={salaryType === 'hourly' ? '25' : '80000'} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Salary Max</label>
              <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder={salaryType === 'hourly' ? '50' : '120000'} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Currency</label>
              <input type="text" value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Pay Type</label>
              <CustomSelect
                value={salaryType}
                onChange={setSalaryType}
                options={[
                  { value: 'annual', label: 'Annual' },
                  { value: 'hourly', label: 'Hourly' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Equity</label>
            <input type="text" value={equity} onChange={(e) => setEquity(e.target.value)} placeholder="e.g. 0.2% – 0.8%" className={inputClass} />
          </div>

          <SkillInput label="Required Skills" skills={requiredSkills} onChange={setRequiredSkills} variant="required" />
          <SkillInput label="Nice-to-Have Skills" skills={niceToHaveSkills} onChange={setNiceToHaveSkills} variant="nice" />

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Job Summary</label>
            <textarea value={jobSummary} onChange={(e) => setJobSummary(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Status</label>
              <StatusSelect value={status} onChange={setStatus} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Date Applied</label>
              <DatePicker value={dateApplied} onChange={setDateApplied} placeholder="Select date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Follow-up Date</label>
              <DatePicker value={followUpDate} onChange={setFollowUpDate} placeholder="Select date" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Date Posted</label>
              <DatePicker value={datePosted} onChange={setDatePosted} placeholder="Select date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Application Deadline</label>
              <DatePicker value={applicationDeadline} onChange={setApplicationDeadline} placeholder="Select date" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any notes about this application..." className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-stone-200/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 bg-white/50 hover:bg-white/70 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !companyName.trim() || !jobTitle.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 shadow-sm"
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
