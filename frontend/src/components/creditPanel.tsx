import { useEffect } from 'react'
import { X } from 'lucide-react'
import Portal from '@/components/portal'

export type CreditUsage = {
  label: string
  used: number
  total: number
}

type CreditPanelProps = {
  open: boolean
  onClose: () => void
  usage: CreditUsage[]
}

function CreditPanel({ open, onClose, usage }: CreditPanelProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const usedAll = usage.reduce((sum, u) => sum + u.used, 0)
  const totalAll = usage.reduce((sum, u) => sum + u.total, 0)

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 animate-[fade-in_0.2s_ease-out] bg-black/50"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full max-w-sm animate-[scale-in_0.2s_ease-out] rounded-2xl bg-white p-5 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.2)]"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F0ECF7] hover:text-[#1F2937]"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="font-thai mb-0.5 pr-8 text-xl font-bold text-[#1F2937]">
            เครดิต AI
          </p>
          <p className="font-thai mb-4 text-base text-[#6B7280]">
            เหลือ {usedAll} / {totalAll} ครั้ง เดือนนี้
          </p>
          <div className="flex flex-col gap-3.5">
            {usage.map((u) => (
              <div key={u.label}>
                <div className="font-thai mb-1.5 flex items-center justify-between text-base font-medium text-[#374151]">
                  <span>{u.label}</span>
                  <span className="font-normal text-[#6B7280]">
                    {u.used} / {u.total} ครั้ง
                  </span>
                </div>
                <div className="bg-amalfilight h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-amalfidark h-full rounded-full"
                    style={{
                      width: `${Math.round((u.used / u.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default CreditPanel
