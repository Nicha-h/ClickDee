import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import Portal from '@/components/portal'
import { useSubscription } from '@/lib/subscriptionContext'
import { formatResetLabel, progressBarColor } from '@/lib/usageFormat'

type UsagePanelProps = {
  open: boolean
  onClose: () => void
}

type QuotaRowProps = {
  label: string
  tooltip?: string
  used: number
  max: number
  tier: 'freemium' | 'starter' | 'pro'
}

function QuotaRow({ label, tooltip, used, max, tier }: QuotaRowProps) {
  const atLimit = used >= max
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-base font-medium text-[#374151]">
        <span title={tooltip}>{label}</span>
        <span className="font-normal text-[#6B7280]">
          {used} / {max}
        </span>
      </div>
      <div className="bg-amalfilight h-1.5 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min((used / max) * 100, 100)}%`,
            backgroundColor: progressBarColor(used, max),
          }}
        />
      </div>
      {atLimit &&
        (tier !== 'pro' ? (
          <Link
            to="/setting"
            className="mt-1.5 inline-block text-sm font-semibold text-[#17438D] hover:underline"
          >
            Upgrade to Pro
          </Link>
        ) : (
          <p className="mt-1.5 text-sm text-[#6B7280]">
            You've reached your Pro limit for this period.
          </p>
        ))}
    </div>
  )
}

function UsagePanel({ open, onClose }: UsagePanelProps) {
  const { tier, usage, tierConfig } = useSubscription()

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
            การใช้งาน (Usage)
          </p>
          <p className="font-thai mb-4 text-sm text-[#6B7280]">
            {formatResetLabel(tierConfig.resetPeriod)}
          </p>

          <div className="flex flex-col gap-4">
            <QuotaRow
              label="Ads Created"
              tooltip="Each ad includes a caption and an image, ready to post or launch"
              used={usage.adsCreated}
              max={tierConfig.quota.adsCreated}
              tier={tier}
            />
            <QuotaRow
              label="Consultant Questions"
              tooltip="Questions you've asked your marketing consultant this month"
              used={usage.consultantQuestions}
              max={tierConfig.quota.consultantQuestions}
              tier={tier}
            />
            <QuotaRow
              label="AI Image Creation"
              used={usage.aiImageCreation}
              max={tierConfig.quota.aiImageCreation}
              tier={tier}
            />
            <QuotaRow
              label="AI Video Creation"
              used={usage.aiVideoCreation}
              max={tierConfig.quota.aiVideoCreation}
              tier={tier}
            />

            <div>
              <p className="text-base font-medium text-[#374151]">
                {usage.activeCampaigns} active campaigns
              </p>
              <p className="text-sm text-[#6B7280]">
                Checked {usage.optimizationChecksThisWeek} times this week
              </p>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default UsagePanel
