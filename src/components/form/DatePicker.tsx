import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'

interface DatePickerProps {
  value: string // ISO date string (YYYY-MM-DD) or empty
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function DatePicker({ value, onChange, className = '', placeholder = 'Select date' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  // Calendar view state
  const today = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  const selectedDate = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(() => selectedDate?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => selectedDate?.getMonth() ?? today.getMonth())

  // Reset view when opened
  useEffect(() => {
    if (open) {
      const d = selectedDate ?? today
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [open])

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const calendarHeight = 340
      const top = spaceBelow < calendarHeight ? rect.top - calendarHeight - 4 : rect.bottom + 4
      setMenuPos({
        top,
        left: Math.min(rect.left, window.innerWidth - 296),
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

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

    const days: { day: number; month: 'prev' | 'current' | 'next' }[] = []

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: 'prev' })
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current' })
    }

    // Next month padding
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: 'next' })
    }

    return days
  }, [viewYear, viewMonth])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  function selectDay(day: number, month: 'prev' | 'current' | 'next') {
    let y = viewYear
    let m = viewMonth
    if (month === 'prev') {
      m -= 1
      if (m < 0) { m = 11; y -= 1 }
    } else if (month === 'next') {
      m += 1
      if (m > 11) { m = 0; y += 1 }
    }
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(iso)
    setOpen(false)
  }

  function isSelected(day: number, month: 'prev' | 'current' | 'next') {
    if (!selectedDate || month !== 'current') return false
    return selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day
  }

  function isToday(day: number, month: 'prev' | 'current' | 'next') {
    if (month !== 'current') return false
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
  }

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full frost-input text-stone-800 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between gap-2 cursor-pointer focus:ring-2 focus:ring-amber-600/30 outline-none"
      >
        <span className={`flex items-center gap-2 truncate ${!displayValue ? 'text-stone-400' : ''}`}>
          <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
          {displayValue || placeholder}
        </span>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="text-stone-400 hover:text-stone-600 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="frost-strong rounded-xl shadow-lg p-3 z-[100] w-[280px]"
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
        >
          {/* Month/year header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/40 text-stone-500 hover:text-stone-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-stone-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/40 text-stone-500 hover:text-stone-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((d, i) => {
              const selected = isSelected(d.day, d.month)
              const todayMark = isToday(d.day, d.month)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d.day, d.month)}
                  className={`w-9 h-9 text-xs rounded-lg flex items-center justify-center transition-colors ${
                    selected
                      ? 'bg-amber-700 text-white font-semibold'
                      : todayMark
                        ? 'bg-amber-100/80 text-amber-800 font-semibold'
                        : d.month === 'current'
                          ? 'text-stone-700 hover:bg-white/40'
                          : 'text-stone-300 hover:bg-white/30'
                  }`}
                >
                  {d.day}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-stone-200/50 flex justify-center">
            <button
              type="button"
              onClick={() => {
                const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                onChange(iso)
                setOpen(false)
              }}
              className="text-xs text-amber-700 hover:text-amber-600 font-medium transition-colors"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
