import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import Toast, { type ToastVariant } from '@/components/toast'

const TOAST_DURATION_MS = 3000
// Errors stay up longer — the user needs time to read what went wrong.
const ERROR_TOAST_DURATION_MS = 5000

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Mounted above the routes (see main.tsx) so a toast shown right before a
// navigate() — e.g. deleting a campaign from its review page — survives the
// page change. One toast at a time; a new one replaces the current one.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    id: number
    message: string
    variant: ToastVariant
  } | null>(null)

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      setToast({ id: Date.now(), message, variant })
    },
    [],
  )

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(
      () => setToast(null),
      toast.variant === 'error' ? ERROR_TOAST_DURATION_MS : TOAST_DURATION_MS,
    )
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
