import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll, unlockBodyScroll } from '../lib/bodyScrollLock'
import { getPageScrollY, setPageScrollY } from '../lib/preserveScroll'
import '../components/cms/cms.css'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)
  const scrollYRef = useRef(0)
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback((value: boolean) => {
    const current = pendingRef.current
    pendingRef.current = null
    setPending(null)
    current?.resolve(value)
  }, [])

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const normalized: ConfirmOptions =
      typeof options === 'string' ? { message: options } : options

    return new Promise<boolean>((resolve) => {
      if (pendingRef.current) {
        pendingRef.current.resolve(false)
      }
      scrollYRef.current = getPageScrollY()
      const next: PendingConfirm = {
        title: normalized.title ?? 'Please confirm',
        message: normalized.message,
        confirmLabel: normalized.confirmLabel ?? 'Confirm',
        cancelLabel: normalized.cancelLabel ?? 'Cancel',
        tone: normalized.tone ?? 'danger',
        resolve,
      }
      pendingRef.current = next
      setPending(next)
    })
  }, [])

  useEffect(() => {
    if (!pending) return

    const y = scrollYRef.current
    lockBodyScroll()
    setPageScrollY(y)

    const frame = window.requestAnimationFrame(() => {
      confirmBtnRef.current?.focus({ preventScroll: true })
      setPageScrollY(y)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      unlockBodyScroll()
      setPageScrollY(y)
      requestAnimationFrame(() => setPageScrollY(y))
      window.setTimeout(() => setPageScrollY(y), 0)
    }
  }, [pending])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="cms-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cms-confirm-title"
              aria-describedby="cms-confirm-message"
              data-lenis-prevent
            >
              <button
                type="button"
                className="cms-confirm__backdrop"
                aria-label="Dismiss"
                onClick={() => close(false)}
              />
              <div className="cms-confirm__panel">
                <h2 id="cms-confirm-title" className="cms-confirm__title">
                  {pending.title}
                </h2>
                <p id="cms-confirm-message" className="cms-confirm__message">
                  {pending.message}
                </p>
                <div className="cms-confirm__actions">
                  <button
                    type="button"
                    className="cms-confirm__btn cms-confirm__btn--ghost"
                    onClick={() => close(false)}
                  >
                    {pending.cancelLabel}
                  </button>
                  <button
                    ref={confirmBtnRef}
                    type="button"
                    className={`cms-confirm__btn cms-confirm__btn--${pending.tone === 'danger' ? 'danger' : 'primary'}`}
                    onClick={() => close(true)}
                  >
                    {pending.confirmLabel}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}
