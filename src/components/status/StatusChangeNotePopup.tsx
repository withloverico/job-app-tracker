import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Status } from '../../types'
import { STATUS_DOT_COLORS } from '../../types'

interface StatusChangeNotePopupProps {
  oldStatus: Status
  newStatus: Status
  onSave: (note?: string) => Promise<void>
  onCancel: () => void
}

export default function StatusChangeNotePopup({
  oldStatus,
  newStatus,
  onSave,
  onCancel,
}: StatusChangeNotePopupProps) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave(withNote: boolean) {
    setSaving(true)
    await onSave(withNote ? note.trim() || undefined : undefined)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative frost-strong rounded-2xl w-full max-w-sm sm:max-w-md shadow-xl p-5 sm:p-7"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_COLORS[oldStatus]}`} />
          <span className="text-sm sm:text-base text-stone-600">{oldStatus}</span>
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_COLORS[newStatus]}`} />
          <span className="text-sm sm:text-base font-medium text-stone-800">{newStatus}</span>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about this change..."
          rows={3}
          autoFocus
          className="w-full frost-input text-stone-800 rounded-lg px-3 py-2 sm:py-3 text-sm sm:text-base placeholder:text-stone-400 resize-none mb-4"
        />

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-stone-600 hover:text-stone-800 bg-white/50 hover:bg-white/70 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-amber-700 hover:bg-amber-600 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
