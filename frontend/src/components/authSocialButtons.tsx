import { useRef, useState } from 'react'
import googleIcon from '@/assets/logos/google-icon.svg'
import facebookIconBg from '@/assets/logos/facebook-icon-bg.svg'
import facebookIconF from '@/assets/logos/facebook-icon-f.svg'

const TAP_TOOLTIP_DURATION_MS = 2000

// TODO: wire up Google/Facebook OAuth once an auth provider is configured
function ComingSoonButton({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTap = () => {
    setShowTooltip(true)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(
      () => setShowTooltip(false),
      TAP_TOOLTIP_DURATION_MS,
    )
  }

  return (
    <div
      className="relative flex flex-1"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <div className="font-thai bg-amalfidark absolute -top-9 left-1/2 z-10 -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap text-white shadow-lg">
          เร็ว ๆ นี้
        </div>
      )}
      <button
        type="button"
        aria-disabled="true"
        onClick={handleTap}
        className="border-amalfilight-hover flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border-[1.5px] bg-white px-4 py-3.5"
      >
        {icon}
        <p className="font-thai text-base font-medium text-[#232323]">
          {label}
        </p>
      </button>
    </div>
  )
}

function AuthSocialButtons() {
  return (
    <>
      <div className="flex h-5 w-full items-center justify-center gap-3">
        <div className="bg-amalfilight-hover h-px flex-1" />
        <p className="font-thai text-sm text-[#8E98A8]">หรือ</p>
        <div className="bg-amalfilight-hover h-px flex-1" />
      </div>
      <div className="flex w-full items-start gap-4">
        <ComingSoonButton
          icon={<img src={googleIcon} alt="" className="h-7 w-7" />}
          label="Google"
        />
        <ComingSoonButton
          icon={
            <span className="relative inline-block h-8.75 w-8.75 shrink-0">
              <img
                src={facebookIconBg}
                alt=""
                className="absolute inset-0 h-full w-full"
              />
              <img
                src={facebookIconF}
                alt=""
                className="absolute top-[18%] left-[41%] h-[82%] w-[41%]"
              />
            </span>
          }
          label="Facebook"
        />
      </div>
    </>
  )
}

export default AuthSocialButtons
