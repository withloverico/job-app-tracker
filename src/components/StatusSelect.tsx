import type { Status } from '../types'
import { STATUSES, STATUS_DOT_COLORS } from '../types'

interface StatusSelectProps {
  value: Status
  onChange: (status: Status) => void
  className?: string
}

export default function StatusSelect({ value, onChange, className = '' }: StatusSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${STATUS_DOT_COLORS[value]}`} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Status)}
        className="w-full appearance-none bg-slate-800 border border-slate-600 text-white rounded-lg pl-7 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
