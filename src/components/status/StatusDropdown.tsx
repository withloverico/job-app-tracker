import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Status } from '../../types'
import { STATUSES, STATUS_COLORS, STATUS_DOT_COLORS } from '../../types'

interface StatusDropdownProps {
  status: Status
  onSelect: (newStatus: Status) => void
  className?: string
}

export default function StatusDropdown({ status, onSelect, className = '' }: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - 208), // 208 = w-52
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

    // Delay listener so the opening click doesn't immediately close it
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
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-amber-600/30 ${STATUS_COLORS[status]}`}
      >
        {status}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="w-44 sm:w-52 frost-strong rounded-xl shadow-lg py-1.5 z-[100]"
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setOpen(false)
                if (s !== status) {
                  onSelect(s)
                }
              }}
              className={`w-full px-3 py-2 text-xs sm:text-sm text-left flex items-center gap-2 transition-colors ${
                s === status
                  ? 'bg-white/40 font-semibold text-stone-800'
                  : 'text-stone-600 hover:bg-white/30 hover:text-stone-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[s]}`} />
              {s}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
