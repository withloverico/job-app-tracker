import { useState, useEffect, useMemo, useCallback } from 'react'
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
} from 'lucide-react'
import type { Application } from '../types'
import { STATUSES, STATUS_DOT_COLORS } from '../types'
import { useApplications } from '../hooks/useApplications'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
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
  const { applications, loading, add, update, remove } = useApplications()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [deletingApp, setDeletingApp] = useState<Application | null>(null)
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
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status summary bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'frost-strong text-stone-800 shadow-sm'
                  : 'frost-light text-stone-600 hover:text-stone-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[s]}`} />
              {s}
              <span className="text-stone-400 ml-0.5">{statusCounts[s]}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 z-10" />
            <input
              type="text"
              placeholder="Search company or job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full frost-input text-stone-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-stone-400"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none z-10" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="appearance-none frost-input text-stone-800 rounded-lg pl-9 pr-8 py-2 text-sm cursor-pointer w-full"
              >
                <option value="created_at">Date Added</option>
                <option value="application_deadline">Deadline</option>
                <option value="company_name">Company</option>
              </select>
            </div>

            <div className="flex frost rounded-lg">
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
              className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
          </div>
        )}

        {/* Empty state */}
        {!loading && applications.length === 0 && (
          <div className="text-center py-20">
            <div className="frost rounded-2xl p-8 max-w-md mx-auto shadow-sm">
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
            <div className="frost rounded-2xl p-6 max-w-sm mx-auto shadow-sm">
              <p className="text-stone-500">No applications match your filters.</p>
            </div>
          </div>
        )}

        {/* Card View */}
        {!loading && filtered.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => openEdit(app)}
                className="frost rounded-xl p-4 hover:bg-white/40 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-stone-800 font-medium truncate group-hover:text-amber-800 transition-colors">
                      {app.job_title}
                    </h3>
                    <p className="text-stone-500 text-sm truncate">{app.company_name}</p>
                  </div>
                  <StatusBadge status={app.status} className="ml-2 flex-shrink-0" />
                </div>

                <div className="space-y-1.5 text-sm text-stone-500">
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
                  {formatSalary(app) && (
                    <p className="text-emerald-700 text-xs font-medium">{formatSalary(app)}</p>
                  )}
                  {app.application_deadline && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-stone-400">
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

        {/* Table View */}
        {!loading && filtered.length > 0 && viewMode === 'table' && (
          <div className="overflow-x-auto frost rounded-xl shadow-sm">
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
                    onClick={() => openEdit(app)}
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
      </main>

      <footer className="mt-auto flex justify-center px-4 py-6">
        <a
          href="https://linkedin.com/in/ricobolos"
          target="_blank"
          rel="noopener noreferrer"
          className="frost rounded-full px-4 py-2 text-xs text-stone-500 hover:text-stone-700 transition-colors shadow-sm"
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
    </div>
  )
}
