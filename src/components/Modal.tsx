import { useEffect, useRef, type ReactNode } from 'react'
import { useI18n } from '../i18n'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide }: Props) {
  const { t } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && !el.open) {
      el.showModal()
      // Focus the dialog itself so opening on a phone doesn't pop up the keyboard or ring the close button.
      el.focus()
    }
    return () => el?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal-body">
        <div className="modal-head no-print">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('סגירה', 'Close')}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
