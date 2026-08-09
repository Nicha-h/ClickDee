type OnboardingProgressProps = {
  current: number
  total: number
}

function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-thai text-sm whitespace-nowrap text-[#8e98a8]">
        ขั้นตอน {current} จาก {total}
      </p>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1
          const isActive = step === current
          return (
            <span
              key={step}
              className={`h-2.5 rounded-full transition-all ${
                isActive ? 'bg-amalfi w-6' : 'bg-amalfilight-active w-2.5'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}

export default OnboardingProgress
