import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_DURATION_MS = 3400

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    setToast({ message, type })
    timeoutRef.current = window.setTimeout(() => {
      setToast(null)
      timeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div
          className={`app-toast app-toast--${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
