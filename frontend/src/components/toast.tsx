import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import Portal from '@/components/portal'

export type ToastVariant = 'success' | 'error'

type ToastProps = {
  message: string
  variant: ToastVariant
  onClose: () => void
}

// Styled to match confirmDialog.tsx (same card border, radius, shadow and
// Kanit text), pinned top-center in the Topbar's empty middle so it never
// covers a bottom-anchored input like the AI chat box. The
// error variant only swaps the icon (red, as used for errors elsewhere) and
// uses role="alert" so screen readers announce it immediately.
function Toast({ message, variant, onClose }: ToastProps) {
  const isError = variant === 'error'
  return (
    <Portal>
      <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <div
          role={isError ? 'alert' : 'status'}
          aria-live={isError ? 'assertive' : 'polite'}
          className="pointer-events-auto flex animate-[fade-in_0.2s_ease-out] items-center gap-3 rounded-xl border border-[#8E98A8] bg-white px-5 py-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
        >
          {isError ? (
            <CircleAlert className="h-6 w-6 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="text-amalfi h-6 w-6 shrink-0" />
          )}
          <p className="font-thai text-base font-medium text-[#1F2937]">
            {message}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="ml-1 rounded-md p-1 text-[#8E98A8] hover:bg-[#F0ECF7] hover:text-[#6B7280]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Portal>
  )
}

export default Toast
