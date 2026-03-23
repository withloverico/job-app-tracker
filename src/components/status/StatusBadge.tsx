import type { Status } from '../types'
import { STATUS_COLORS } from '../types'

export default function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]} ${className}`}
    >
      {status}
    </span>
  )
}
