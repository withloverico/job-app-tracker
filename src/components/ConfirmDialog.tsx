interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative frost-strong rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-xl">
        <h3 className="text-lg sm:text-xl font-semibold text-stone-800">{title}</h3>
        <p className="mt-2 text-sm sm:text-base text-stone-600">{message}</p>
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm text-stone-600 hover:text-stone-800 bg-white/50 hover:bg-white/70 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
