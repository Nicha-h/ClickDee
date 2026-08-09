import type { ComponentType } from 'react'

type OnboardingChoiceCardProps = {
  label: string
  icon?: ComponentType<{ className?: string }>
  iconSrc?: string
  selected: boolean
  comingSoon?: boolean
  onClick: () => void
}

function OnboardingChoiceCard({
  label,
  icon: Icon,
  iconSrc,
  selected,
  comingSoon,
  onClick,
}: OnboardingChoiceCardProps) {
  return (
    <button
      type="button"
      disabled={comingSoon}
      onClick={onClick}
      className={`font-thai relative flex h-32 min-w-45 flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl px-3 py-6 text-center transition-all ${
        comingSoon
          ? 'border-amalfilight-hover cursor-not-allowed border-[1.5px] bg-white opacity-50'
          : selected
            ? 'border-amalfi bg-amalfilight border-2 hover:cursor-pointer'
            : 'border-amalfilight-hover hover:border-amalfilight-active border-[1.5px] bg-white hover:cursor-pointer'
      }`}
    >
      {comingSoon && (
        <span className="absolute top-3 text-[11px] text-[#8e98a8]">
          Coming Soon
        </span>
      )}
      {Icon ? (
        <Icon
          className={`h-7 w-7 shrink-0 ${selected ? 'text-amalfi' : 'text-[#232323]'}`}
        />
      ) : iconSrc ? (
        <img src={iconSrc} alt="" className="h-7 w-7 shrink-0" />
      ) : null}
      <span
        className={`text-[15px] ${selected ? 'text-amalfi font-semibold' : 'font-medium text-[#232323]'}`}
      >
        {label}
      </span>
    </button>
  )
}

export default OnboardingChoiceCard
