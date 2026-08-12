import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'

export type TrendPoint = { label: string; [seriesKey: string]: number | string }
export type TrendSeries = { key: string; label: string; color: string }

function ChartTooltip({
  active,
  payload,
  label,
  series,
  valueFormatter,
}: Partial<TooltipContentProps<number, string>> & {
  series: TrendSeries[]
  valueFormatter?: (v: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-[0_4px_4px_rgba(0,0,0,0.15)]">
      <p className="font-thai text-sm font-semibold text-black">{label}</p>
      <div className="mt-1 flex flex-col gap-1">
        {payload.map((entry) => {
          const s = series.find((item) => item.key === entry.dataKey)
          const value = entry.value as number
          return (
            <div
              key={String(entry.dataKey)}
              className="flex items-center gap-2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s?.color }}
              />
              <span className="font-thai text-sm text-black">{s?.label}</span>
              <span className="ml-auto text-sm font-semibold text-black">
                {valueFormatter ? valueFormatter(value) : value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegend({ series }: { series: TrendSeries[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4">
      {series.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          <p className="font-thai text-lg font-semibold text-black">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}

function TrendChart({
  data,
  series,
  valueFormatter,
  height = 240,
}: {
  data: TrendPoint[]
  series: TrendSeries[]
  valueFormatter?: (v: number) => string
  height?: number
}) {
  const isSingleSeries = series.length === 1
  const maxAbsValue = Math.max(
    0,
    ...data.flatMap((point) =>
      series.map((s) => Math.abs(Number(point[s.key]) || 0)),
    ),
  )
  const widestLabel = valueFormatter
    ? valueFormatter(maxAbsValue)
    : maxAbsValue.toLocaleString()
  const yAxisWidth = Math.max(44, widestLabel.length * 7 + 16)

  return (
    <div className="w-full">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {isSingleSeries ? (
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trendChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={series[0].color}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={series[0].color}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#8E98A8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#8E98A8' }}
                axisLine={false}
                tickLine={false}
                width={yAxisWidth}
                tickFormatter={valueFormatter}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    series={series}
                    valueFormatter={valueFormatter}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={series[0].key}
                stroke={series[0].color}
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#trendChartFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#8E98A8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#8E98A8' }}
                axisLine={false}
                tickLine={false}
                width={yAxisWidth}
                tickFormatter={valueFormatter}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    series={series}
                    valueFormatter={valueFormatter}
                  />
                }
              />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {series.length > 1 && <ChartLegend series={series} />}
    </div>
  )
}

export default TrendChart
