import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  ExternalLink,
  ArrowUpDown,
  Trash2,
  Pencil,
} from 'lucide-react'
import type { Application, Status, StatusHistoryEntry } from '../types'
import { STATUSES, STATUS_DOT_COLORS } from '../types'
import { fetchStatusHistory } from '../lib/api'
import { useApplications } from '../hooks/useApplications'
import Header from '../components/Header'
import StatusBadge from '../components/status/StatusBadge'
import StatusDropdown from '../components/status/StatusDropdown'
import StatusChangeNotePopup from '../components/status/StatusChangeNotePopup'
import StatusTimeline from '../components/status/StatusTimeline'
import AddJobModal from '../components/AddJobModal'
import ConfirmDialog from '../components/ConfirmDialog'

type SortField = 'created_at' | 'application_deadline' | 'company_name'
type ViewMode = 'card' | 'table'

function formatSalary(app: Application): string | null {
  if (!app.salary_min && !app.salary_max) return null
  const currency = app.salary_currency || 'USD'
  const isHourly = app.salary_type === 'hourly'
  const suffix = isHourly ? '/hr' : '/yr'
  const fmt = (n: number) => {
    if (!isHourly && n >= 1000) return `${Math.round(n / 1000)}k`
    return n.toString()
  }
  if (app.salary_min && app.salary_max) return `${currency} ${fmt(app.salary_min)}–${fmt(app.salary_max)}${suffix}`
  if (app.salary_min) return `${currency} ${fmt(app.salary_min)}+${suffix}`
  return `Up to ${currency} ${fmt(app.salary_max!)}${suffix}`
}

export default function Dashboard() {
  const { applications, loading, add, update, remove, changeStatus } = useApplications()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [deletingApp, setDeletingApp] = useState<Application | null>(null)
  const [flippedCard, setFlippedCard] = useState<string | null>(null)
  const [closingCard, setClosingCard] = useState(false)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    appId: string
    oldStatus: Status
    newStatus: Status
  } | null>(null)
  const [historyCache, setHistoryCache] = useState<Record<string, StatusHistoryEntry[]>>({})
  const [historyLoading, setHistoryLoading] = useState(false)

  const statusHistory = flippedCard ? historyCache[flippedCard] || [] : []

  useEffect(() => {
    if (!flippedCard) return
    const hasCached = !!historyCache[flippedCard]
    if (!hasCached) setHistoryLoading(true)
    fetchStatusHistory(flippedCard)
      .then((data) => setHistoryCache(prev => ({ ...prev, [flippedCard]: data })))
      .catch(() => {
        if (!hasCached) setHistoryCache(prev => ({ ...prev, [flippedCard]: [] }))
      })
      .finally(() => setHistoryLoading(false))
  }, [flippedCard])

  const closeFlippedCard = useCallback(() => {
    setClosingCard(true)
    setTimeout(() => {
      setFlippedCard(null)
      setClosingCard(false)
    }, 350)
  }, [])
  const [sortOpen, setSortOpen] = useState(false)
  const sortButtonRef = useRef<HTMLButtonElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [sortMenuPos, setSortMenuPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!sortOpen) return
    if (sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect()
      setSortMenuPos({ top: rect.bottom + 4, left: rect.left })
    }
    const timer = setTimeout(() => {
      function handleClick(e: MouseEvent) {
        if (
          sortButtonRef.current && !sortButtonRef.current.contains(e.target as Node) &&
          sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)
        ) {
          setSortOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }, 0)
    return () => clearTimeout(timer)
  }, [sortOpen])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('viewMode') as ViewMode) || 'card'
  })

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setEditingApp(null)
        setModalOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filtered = useMemo(() => {
    let result = [...applications]

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.company_name.toLowerCase().includes(q) ||
          a.job_title.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      switch (sortField) {
        case 'company_name':
          return a.company_name.localeCompare(b.company_name)
        case 'application_deadline': {
          if (!a.application_deadline) return 1
          if (!b.application_deadline) return -1
          return a.application_deadline.localeCompare(b.application_deadline)
        }
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return result
  }, [applications, statusFilter, search, sortField])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    STATUSES.forEach((s) => (counts[s] = 0))
    applications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1
    })
    return counts
  }, [applications])

  const handleSave = useCallback(
    async (data: Partial<Application>) => {
      if (editingApp) {
        return await update(editingApp.id, data)
      } else {
        return await add(data)
      }
    },
    [editingApp, add, update]
  )

  const openEdit = (app: Application) => {
    setEditingApp(app)
    setModalOpen(true)
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-14 pb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status summary bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide dash-enter">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors frost-strong ${
                statusFilter === s
                  ? 'text-stone-800 shadow-sm ring-2 ring-amber-600/30'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[s]}`} />
              {s}
              <span className="text-stone-400 ml-0.5">{statusCounts[s]}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide pb-1 dash-enter" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 z-10" />
            <input
              type="text"
              placeholder="Search company or job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full frost-strong text-stone-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-stone-400 focus:ring-2 focus:ring-amber-600/30 outline-none"
            />
          </div>

          <div className="relative flex-shrink-0">
            <button
              ref={sortButtonRef}
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 frost-strong text-stone-800 rounded-lg pl-3 pr-3 py-2 text-sm cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4 text-stone-400" />
              {{ created_at: 'Date Added', application_deadline: 'Deadline', company_name: 'Company' }[sortField]}
            </button>
            {sortOpen && createPortal(
              <div
                ref={sortMenuRef}
                className="w-44 sm:w-52 frost-strong rounded-xl shadow-lg py-1.5 z-[100]"
                style={{ position: 'fixed', top: sortMenuPos.top, left: sortMenuPos.left }}
              >
                {([
                  { value: 'created_at', label: 'Date Added' },
                  { value: 'application_deadline', label: 'Deadline' },
                  { value: 'company_name', label: 'Company' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortField(opt.value)
                      setSortOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-xs sm:text-sm text-left flex items-center gap-2 transition-colors ${
                      sortField === opt.value
                        ? 'bg-white/40 font-semibold text-stone-800'
                        : 'text-stone-600 hover:bg-white/30 hover:text-stone-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          <div className="flex frost-strong rounded-lg flex-shrink-0">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-white/50 text-stone-800' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-white/50 text-stone-800' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingApp(null)
              setModalOpen(true)
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>

        {/* Mobile Add Job button */}
        <button
          onClick={() => {
            setEditingApp(null)
            setModalOpen(true)
          }}
          className="sm:hidden flex items-center justify-center gap-2 w-full mb-6 px-4 py-2.5 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm dash-enter"
          style={{ animationDelay: '0.15s' }}
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
          </div>
        )}

        {/* Empty state */}
        {!loading && applications.length === 0 && (
          <div className="text-center py-20">
            <div className="frost-strong rounded-2xl p-8 max-w-md mx-auto shadow-sm">
              <div className="frost-strong w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">No applications yet</h3>
              <p className="text-stone-500 mb-6">
                Add your first job application by clicking the button below or pressing{' '}
                <kbd className="px-1.5 py-0.5 frost-strong text-xs rounded font-mono">
                  Cmd+K
                </kbd>
              </p>
              <button
                onClick={() => {
                  setEditingApp(null)
                  setModalOpen(true)
                }}
                className="px-6 py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Add Your First Job
              </button>
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && applications.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="frost-strong rounded-2xl p-6 max-w-sm mx-auto shadow-sm">
              <p className="text-stone-500">No applications match your filters.</p>
            </div>
          </div>
        )}

        {/* Card View */}
        {!loading && filtered.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 dash-enter" style={{ animationDelay: '0.2s' }}>
            {filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => setFlippedCard(app.id)}
                className="frost-strong rounded-xl p-4 sm:p-5 h-52 sm:h-64 overflow-hidden cursor-pointer group shadow-sm hover:bg-white/40 transition-colors flex flex-col"
              >
                {/* Card content */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-stone-800 font-medium truncate group-hover:text-amber-800 transition-colors">
                      {app.job_title}
                    </h3>
                    <p className="text-stone-500 text-sm truncate">{app.company_name}</p>
                  </div>
                  <StatusDropdown
                    status={app.status}
                    className="ml-2 flex-shrink-0"
                    onSelect={(newStatus) => {
                      setStatusChangeTarget({
                        appId: app.id,
                        oldStatus: app.status,
                        newStatus,
                      })
                    }}
                  />
                </div>

                <div className="space-y-1.5 text-sm text-stone-500 flex-1 min-h-0 overflow-hidden">
                  {(app.location || app.is_remote) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {app.location}
                        {app.is_remote && (
                          <span className="text-emerald-600 ml-1">(Remote)</span>
                        )}
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-medium">
                    <span className="text-emerald-700">{formatSalary(app) || 'N/A'}</span>
                    <span className="text-stone-300 mx-1.5">|</span>
                    <span className="text-stone-500">{app.equity || 'N/A'}</span>
                  </p>
                  {app.date_posted && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      Posted: {new Date(app.date_posted).toLocaleDateString()}
                    </div>
                  )}
                  {app.application_deadline && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between mt-auto pt-2 flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-800 rounded-full px-2.5 py-0.5 shadow-sm bg-emerald-100/70 backdrop-blur-sm border border-emerald-200/50">
                    Added: {new Date(app.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                        title="View job posting"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingApp(app)
                      }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/job/${app.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-amber-700 hover:text-amber-600 flex items-center gap-1"
                    >
                      Details <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Flipped card detail modal */}
        {flippedCard && (() => {
          const app = applications.find(a => a.id === flippedCard)
          if (!app) return null
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeFlippedCard}>
              <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm flip-backdrop ${closingCard ? 'closing' : ''}`} />
              <div
                onClick={(e) => e.stopPropagation()}
                className={`relative frost-strong rounded-2xl w-full max-w-lg sm:max-w-xl shadow-xl flip-card-modal ${closingCard ? 'closing' : ''} p-5 sm:p-8 max-h-[80vh] overflow-y-auto`}
              >
                {/* Header with Edit button */}
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-stone-800">{app.job_title}</h3>
                    <p className="text-stone-500 text-sm sm:text-base">{app.company_name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setFlippedCard(null)
                      setClosingCard(false)
                      openEdit(app)
                    }}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs sm:text-sm font-medium rounded-full transition-colors shadow-sm flex-shrink-0 ml-3"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                {/* Status & meta */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <StatusDropdown
                    status={app.status}
                    onSelect={(newStatus) => {
                      setStatusChangeTarget({
                        appId: app.id,
                        oldStatus: app.status,
                        newStatus,
                      })
                    }}
                  />
                  {(app.location || app.is_remote) && (
                    <span className="text-xs sm:text-sm text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3 sm:w-4 h-3 sm:h-4" />
                      {app.location}{app.is_remote && ' (Remote)'}
                    </span>
                  )}
                  {formatSalary(app) && (
                    <span className="text-xs sm:text-sm font-medium text-emerald-700">{formatSalary(app)}</span>
                  )}
                </div>

                {app.job_summary && (
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm font-medium text-stone-600 mb-1">Summary</p>
                    <p className="text-sm sm:text-base text-stone-600 leading-relaxed">{app.job_summary}</p>
                  </div>
                )}

                {app.required_skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm font-medium text-stone-600 mb-1.5">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {app.required_skills.map((skill) => (
                        <span key={skill} className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {app.nice_to_have_skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm font-medium text-stone-600 mb-1.5">Nice to Have</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {app.nice_to_have_skills.map((skill) => (
                        <span key={skill} className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-stone-100/80 text-stone-600 border border-stone-200/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {app.notes && (
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm font-medium text-stone-600 mb-1">Notes</p>
                    <p className="text-sm sm:text-base text-stone-500 italic">{app.notes}</p>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="mb-4">
                  <p className="text-xs sm:text-sm font-medium text-stone-600 mb-2">Status History</p>
                  {historyLoading ? (
                    <div className="flex justify-center py-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700" />
                    </div>
                  ) : (
                    <StatusTimeline history={statusHistory} createdAt={app.created_at} />
                  )}
                </div>

                {/* Footer meta */}
                <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-stone-400 pt-2 border-t border-stone-200/50">
                  {app.date_posted && <span>Posted: {new Date(app.date_posted).toLocaleDateString()}</span>}
                  {app.application_deadline && <span>Deadline: {new Date(app.application_deadline).toLocaleDateString()}</span>}
                  {app.date_applied && <span>Applied: {new Date(app.date_applied).toLocaleDateString()}</span>}
                  <span>Added: {new Date(app.created_at).toLocaleDateString()}</span>
                  {app.job_url && (
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-600 flex items-center gap-1">
                      Job posting <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Table View */}
        {!loading && filtered.length > 0 && viewMode === 'table' && (
          <div className="overflow-x-auto frost-strong rounded-xl shadow-sm dash-enter" style={{ animationDelay: '0.2s' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-stone-600 text-left border-b border-stone-200/50">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Salary</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Deadline</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Added</th>
                  <th className="px-4 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/30">
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setFlippedCard(app.id)}
                    className="hover:bg-white/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-stone-800 font-medium">{app.company_name}</td>
                    <td className="px-4 py-3 text-stone-600">
                      <Link
                        to={`/job/${app.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-amber-700 transition-colors"
                      >
                        {app.job_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">
                      {app.location || '—'}
                      {app.is_remote && <span className="text-emerald-600 ml-1">(R)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                      {formatSalary(app) || '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden lg:table-cell">
                      {app.application_deadline
                        ? new Date(app.application_deadline).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-400 hidden md:table-cell">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingApp(app)
                        }}
                        className="text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 py-3 pointer-events-none">
        <a
          href="https://linkedin.com/in/ricobolos"
          target="_blank"
          rel="noopener noreferrer"
          className="frost rounded-full px-4 py-2 text-xs text-stone-500 hover:text-stone-700 transition-colors shadow-sm pointer-events-auto"
        >
          Built with love by <span className="font-medium text-stone-700">Rico Bolos</span>
        </a>
      </footer>

      <AddJobModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingApp(null)
        }}
        onSave={handleSave}
        editingApp={editingApp}
        applications={applications}
      />

      <ConfirmDialog
        open={!!deletingApp}
        title="Delete Application"
        message={deletingApp ? `Are you sure you want to delete your application for ${deletingApp.job_title} at ${deletingApp.company_name}?` : ''}
        onConfirm={async () => {
          if (deletingApp) {
            await remove(deletingApp.id)
            setDeletingApp(null)
          }
        }}
        onCancel={() => setDeletingApp(null)}
      />

      {statusChangeTarget && (
        <StatusChangeNotePopup
          oldStatus={statusChangeTarget.oldStatus}
          newStatus={statusChangeTarget.newStatus}
          onSave={async (note) => {
            const result = await changeStatus(statusChangeTarget.appId, statusChangeTarget.newStatus, note)
            if (result?.historyEntry) {
              setHistoryCache(prev => ({
                ...prev,
                [statusChangeTarget.appId]: [...(prev[statusChangeTarget.appId] || []), result.historyEntry],
              }))
            }
            setStatusChangeTarget(null)
          }}
          onCancel={() => setStatusChangeTarget(null)}
        />
      )}
    </div>
  )
}
