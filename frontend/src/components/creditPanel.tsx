import type { CSSProperties, Ref } from 'react'

export type CreditUsage = {
  label: string
  used: number
  total: number
}

type CreditPanelProps = {
  usage: CreditUsage[]
  panelRef?: Ref<HTMLDivElement>
  style?: CSSProperties
}

function CreditPanel({ usage, panelRef, style }: CreditPanelProps) {
  const usedAll = usage.reduce((sum, u) => sum + u.used, 0)
  const totalAll = usage.reduce((sum, u) => sum + u.total, 0)

  return (
    <div
      ref={panelRef}
      style={style}
      className="fixed z-30 w-80 rounded-2xl bg-white p-5 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.2)]"
    >
      <p className="font-thai mb-0.5 text-xl font-bold text-[#1F2937]">
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
                style={{ width: `${Math.round((u.used / u.total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CreditPanel
