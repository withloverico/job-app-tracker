import { X } from 'lucide-react'

interface SkillChipProps {
  skill: string
  onRemove?: () => void
  variant?: 'required' | 'nice'
}

export default function SkillChip({ skill, onRemove, variant = 'required' }: SkillChipProps) {
  const colors =
    variant === 'required'
      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      : 'bg-violet-500/20 text-violet-300 border-violet-500/30'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colors}`}>
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
