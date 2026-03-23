import type { Status } from '../../types'
import { STATUSES, STATUS_DOT_COLORS } from '../../types'
import CustomSelect from './CustomSelect'

interface StatusSelectProps {
  value: Status
  onChange: (status: Status) => void
  className?: string
}

export default function StatusSelect({ value, onChange, className = '' }: StatusSelectProps) {
  return (
    <CustomSelect
      value={value}
      onChange={(v) => onChange(v as Status)}
      className={className}
      options={STATUSES.map((s) => ({
        value: s,
        label: s,
        dot: STATUS_DOT_COLORS[s],
      }))}
    />
  )
}
