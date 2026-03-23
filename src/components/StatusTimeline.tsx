import type { StatusHistoryEntry } from '../types'
import { STATUS_DOT_COLORS } from '../types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

interface StatusTimelineProps {
  history: StatusHistoryEntry[]
  createdAt: string
}

export default function StatusTimeline({ history, createdAt }: StatusTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-xs sm:text-sm text-stone-400 italic">
        No status changes recorded yet.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-stone-200/70" />

      <div className="space-y-3">
        {/* Initial creation entry */}
        <div className="flex gap-3 items-start">
          <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ring-2 ring-white/80 ${STATUS_DOT_COLORS[history[0].old_status]}`} />
          <div>
            <p className="text-xs sm:text-sm text-stone-500">
              Created as <span className="font-medium text-stone-700">{history[0].old_status}</span>
            </p>
            <p className="text-xs sm:text-sm text-stone-400">{timeAgo(createdAt)}</p>
          </div>
        </div>

        {history.map((entry) => (
          <div key={entry.id} className="flex gap-3 items-start">
            <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ring-2 ring-white/80 ${STATUS_DOT_COLORS[entry.new_status]}`} />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-stone-600">
                <span className="text-stone-400">{entry.old_status}</span>
                {' '}
                <span className="text-stone-400">&rarr;</span>
                {' '}
                <span className="font-medium text-stone-700">{entry.new_status}</span>
              </p>
              {entry.note && (
                <p className="text-xs sm:text-sm text-stone-500 italic mt-0.5">{entry.note}</p>
              )}
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5">{timeAgo(entry.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
