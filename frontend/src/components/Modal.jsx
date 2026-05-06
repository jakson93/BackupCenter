import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, title, children, onClose, footer }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={() => onClose?.()}
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-2xl rounded-card border border-bc-border bg-bc-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-bc-border px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-bc-text">{title}</div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-bc-border bg-bc-card2 text-bc-text2 hover:bg-bc-hover"
            onClick={() => onClose?.()}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-bc-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}
