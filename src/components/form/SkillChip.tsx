import { X } from 'lucide-react'

interface SkillChipProps {
  skill: string
  onRemove?: () => void
  variant?: 'required' | 'nice'
}

export default function SkillChip({ skill, onRemove, variant = 'required' }: SkillChipProps) {
  const colors =
    variant === 'required'
      ? 'bg-amber-600/15 text-amber-800 border-amber-400/30'
      : 'bg-emerald-600/15 text-emerald-800 border-emerald-400/30'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colors}`}>
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-stone-900 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
