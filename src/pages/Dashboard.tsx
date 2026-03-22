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
  const { applications, loading, add, update, remove, reload } = useApplications()
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

  // Cmd+K shortcut
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
        const result = await update(editingApp.id, data)
        return result
      } else {
        const result = await add(data)
        return result
      }
    },
    [editingApp, add, update]
  )

  const openEdit = (app: Application) => {
    setEditingApp(app)
    setModalOpen(true)
  }

  return (
    <div className="min-h-dvh bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status summary bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                statusFilter === s
                  ? 'bg-slate-700 border-slate-500 text-white'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[s]}`} />
              {s}
              <span className="text-slate-500 ml-0.5">{statusCounts[s]}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search company or job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="appearance-none bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="created_at">Date Added</option>
                <option value="application_deadline">Deadline</option>
                <option value="company_name">Company</option>
              </select>
            </div>

            <div className="flex bg-slate-800 border border-slate-700 rounded-lg">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-l-lg transition-colors ${viewMode === 'card' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-r-lg transition-colors ${viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setEditingApp(null)
                setModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && applications.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No applications yet</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Add your first job application by clicking the button below or pressing{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-xs">
                Cmd+K
              </kbd>
            </p>
            <button
              onClick={() => {
                setEditingApp(null)
                setModalOpen(true)
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              Add Your First Job
            </button>
          </div>
        )}

        {/* No results */}
        {!loading && applications.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No applications match your filters.</p>
          </div>
        )}

        {/* Card View */}
        {!loading && filtered.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => openEdit(app)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                      {app.job_title}
                    </h3>
                    <p className="text-slate-400 text-sm truncate">{app.company_name}</p>
                  </div>
                  <StatusBadge status={app.status} className="ml-2 flex-shrink-0" />
                </div>

                <div className="space-y-1.5 text-sm text-slate-400">
                  {(app.location || app.is_remote) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {app.location}
                        {app.is_remote && (
                          <span className="text-emerald-400 ml-1">(Remote)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {formatSalary(app) && (
                    <p className="text-emerald-400 text-xs font-medium">{formatSalary(app)}</p>
                  )}
                  {app.application_deadline && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingApp(app)
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/job/${app.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
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
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300 text-left">
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
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => openEdit(app)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-medium">{app.company_name}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <Link
                        to={`/job/${app.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {app.job_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                      {app.location || '—'}
                      {app.is_remote && <span className="text-emerald-400 ml-1">(R)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {formatSalary(app) || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                      {app.application_deadline
                        ? new Date(app.application_deadline).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingApp(app)
                        }}
                        className="text-slate-500 hover:text-red-400 transition-colors"
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

      <AddJobModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingApp(null)
          reload()
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
