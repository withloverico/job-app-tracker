import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Option {
  value: string
  label: string
  dot?: string // optional Tailwind color class for a dot indicator
}

interface CustomSelectProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export default function CustomSelect({ value, options, onChange, className = '', placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })

  const selected = options.find((o) => o.value === value)

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()

    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full frost-input text-stone-800 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between gap-2 cursor-pointer focus:ring-2 focus:ring-amber-600/30 outline-none"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.dot}`} />}
          {selected?.label || placeholder || 'Select...'}
        </span>
        <svg className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="frost-strong rounded-xl shadow-lg py-1.5 z-[100] max-h-64 overflow-y-auto"
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`w-full px-3 py-2 text-xs sm:text-sm text-left flex items-center gap-2 transition-colors ${
                o.value === value
                  ? 'bg-white/40 font-semibold text-stone-800'
                  : 'text-stone-600 hover:bg-white/30 hover:text-stone-800'
              }`}
            >
              {o.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${o.dot}`} />}
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
