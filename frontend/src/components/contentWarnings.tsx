import { TriangleAlert } from 'lucide-react'

type ContentWarningsProps = {
  warnings: string[]
  // campaignReview.tsx renders its proposal card at text-base; the chat
  // card and the caption field use the smaller default.
  large?: boolean
  className?: string
}

// Non-blocking warnings from the backend's AI content screen
// (backend/src/lib/ai-content-screen.ts), shown wherever an AI proposal or
// suggestion is reviewed. Citrus tokens + a lucide icon, per the design system.
function ContentWarnings({
  warnings,
  large = false,
  className = '',
}: ContentWarningsProps) {
  if (warnings.length === 0) return null

  return (
    <div
      role="note"
      className={`font-thai border-citrus bg-citrus-light text-citrusdarker rounded-lg border ${large ? 'p-3 text-base' : 'p-2.5 text-sm'} ${className}`}
    >
      <p className="flex items-center gap-1.5 font-semibold">
        <TriangleAlert
          className={`text-citrusdark shrink-0 ${large ? 'h-5 w-5' : 'h-4 w-4'}`}
        />
        กรุณาตรวจสอบก่อนยืนยัน
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-6">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  )
}

export default ContentWarnings
