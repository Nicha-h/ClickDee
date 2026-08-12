import type { TrendPoint, TrendSeries } from '@/components/trendChart'

export function indexToFirst(
  raw: { date: string; [key: string]: number | string }[],
  keys: string[],
): TrendPoint[] {
  const first = raw[0]
  return raw.map((row) => {
    const point: TrendPoint = { label: row.date }
    for (const key of keys) {
      const firstValue = first[key] as number
      const value = row[key] as number
      point[key] = ((value - firstValue) / firstValue) * 100
    }
    return point
  })
}

export const reachVsSpendSeries: TrendSeries[] = [
  { key: 'reach', label: 'การเข้าถึง', color: '#1E59BC' },
  { key: 'spend', label: 'งบที่ใช้', color: '#77BAFF' },
]

export function percentFormatter(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}
