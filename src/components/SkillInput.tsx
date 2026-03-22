import { useState, type KeyboardEvent } from 'react'
import SkillChip from './SkillChip'

interface SkillInputProps {
  skills: string[]
  onChange: (skills: string[]) => void
  label: string
  variant?: 'required' | 'nice'
}

export default function SkillInput({ skills, onChange, label, variant = 'required' }: SkillInputProps) {
  const [input, setInput] = useState('')

  const addSkill = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed])
    }
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(input)
    }
    if (e.key === 'Backspace' && !input && skills.length > 0) {
      onChange(skills.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800 border border-slate-600 rounded-lg min-h-[42px]">
        {skills.map((skill) => (
          <SkillChip
            key={skill}
            skill={skill}
            variant={variant}
            onRemove={() => onChange(skills.filter((s) => s !== skill))}
          />
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addSkill(input)}
          placeholder={skills.length === 0 ? 'Type and press Enter' : ''}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>
    </div>
  )
}
