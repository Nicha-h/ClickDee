import { useId } from 'react'
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'
import type { TooltipContentProps } from 'recharts'

type SparklinePoint = { label: string; value: number }

function SparklineTooltip({
  active,
  payload,
  valueFormatter,
}: Partial<TooltipContentProps<number, string>> & {
  valueFormatter: (v: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as SparklinePoint

  return (
    <div className="rounded-lg bg-white px-2 py-1.5 text-xs shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
      <p className="font-thai text-black/60">{point.label}</p>
      <p className="font-semibold text-black">{valueFormatter(point.value)}</p>
    </div>
  )
}

function Sparkline({
  data,
  color = '#1E59BC',
  className,
  label,
  valueFormatter = (v) => v.toLocaleString(),
}: {
  data: SparklinePoint[]
  color?: string
  className?: string
  label?: string
  valueFormatter?: (v: number) => string
}) {
  const gradientId = `sparklineFill-${useId()}`

  return (
    <div className={className}>
      <div className="flex h-full w-full flex-col gap-0.5">
        {label && (
          <p className="font-thai shrink-0 truncate text-xs font-semibold text-[#8E98A8]">
            {label}
          </p>
        )}
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<SparklineTooltip valueFormatter={valueFormatter} />}
                cursor={{
                  stroke: color,
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Sparkline
