import { CheckCircle2, X } from 'lucide-react'
import Portal from '@/components/portal'

type ToastProps = {
  message: string
  onClose: () => void
}

// Styled to match confirmDialog.tsx (same card border, radius, shadow and
// Kanit text), pinned bottom-center so it doesn't cover the Topbar.
function Toast({ message, onClose }: ToastProps) {
  return (
    <Portal>
      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto flex animate-[fade-in_0.2s_ease-out] items-center gap-3 rounded-xl border border-[#8E98A8] bg-white px-5 py-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
        >
          <CheckCircle2 className="text-amalfi h-6 w-6 shrink-0" />
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
