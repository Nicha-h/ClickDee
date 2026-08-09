import { Check } from 'lucide-react'

const steps = [
  'บอก AI ว่าคุณต้องการอะไร',
  'AI วิเคราะห์ตลาด',
  'ตรวจสอบและเปิดตัว',
]

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center">
        {steps.map((label, index) => {
          const step = index + 1
          const status =
            step < currentStep
              ? 'completed'
              : step === currentStep
                ? 'active'
                : 'inactive'

          return (
            <div key={label} className="flex items-center">
              <div
                className={`font-thai flex h-10 items-center gap-2 rounded-2xl px-2 text-lg font-bold whitespace-nowrap not-italic md:px-4 ${
                  status === 'completed'
                    ? 'bg-[#519b5c] text-white'
                    : status === 'active'
                      ? 'bg-citrus-light-hover border-citrushover text-citrusdark-hover border border-dashed'
                      : 'border border-[#8E98A8] bg-white text-[#8E98A8]'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-lg font-normal ${
                    status === 'completed'
                      ? 'bg-white text-[#519b5c]'
                      : status === 'active'
                        ? 'border-citrushover text-citrusdark-hover border bg-white'
                        : 'border border-[#8E98A8] text-[#8E98A8]'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </span>
                <span className="hidden md:inline">{label}</span>
              </div>
              {step < steps.length && (
                <div className="mx-2 h-px w-6 shrink-0 bg-[#8E98A8] sm:w-12" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StepIndicator
