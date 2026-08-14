import Portal from '@/components/portal'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 animate-[fade-in_0.2s_ease-out] bg-black/50"
        onClick={onCancel}
      />
      <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
        <div
          className="pointer-events-auto w-full max-w-sm animate-[scale-in_0.2s_ease-out] rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-thai text-amalfidark mb-2 text-xl font-bold">
            {title}
          </h3>
          <p className="font-thai mb-6 text-base font-medium text-[#1F2937]">
            {message}
          </p>
          {children}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="font-thai rounded-xl border border-[#8E98A8] px-5 py-2.5 text-base font-medium text-[#1F2937] hover:bg-[#F0ECF7]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="font-thai rounded-xl bg-[#E07070] px-5 py-2.5 text-base font-medium text-white hover:bg-[#c85050] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#E07070]"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default ConfirmDialog
