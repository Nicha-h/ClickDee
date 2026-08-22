// Thai short month abbreviations, hand-matched to the literal strings
// already used elsewhere in this codebase (data/campaigns.ts, pages/home.tsx)
// rather than sourced from Intl, per the project's no-i18n-library convention.
const THAI_MONTHS_ABBR = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
]

// Cheap deterministic pseudo-random helper (no new dependency) so mock
// values are stable across reloads but still drift forward as new
// days/months/years enter the window, instead of re-randomizing every load.
function seededFraction(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function seededValue(seed: number, base: number, spreadPct: number): number {
  const noise = (seededFraction(seed) - 0.5) * 2 * spreadPct
  return Math.round(base * (1 + noise))
}

export type SalesRangeKey = '7d' | 'monthly' | 'yearly'

export type SalesTrendPoint = { label: string; sales: number }

function buildDailyRange(today: Date): SalesTrendPoint[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const epochDay = Math.floor(d.getTime() / 86_400_000)
    const base = 14000 + i * 900
    return {
      label: `${d.getDate()} ${THAI_MONTHS_ABBR[d.getMonth()]}`,
      sales: seededValue(epochDay, base, 0.05),
    }
  })
}

function buildMonthlyRange(today: Date): SalesTrendPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1)
    const seed = d.getFullYear() * 12 + d.getMonth()
    const base = 140000 + i * 8000
    return {
      label: THAI_MONTHS_ABBR[d.getMonth()],
      sales: seededValue(seed, base, 0.04),
    }
  })
}

function buildYearlyRange(today: Date): SalesTrendPoint[] {
  return Array.from({ length: 5 }, (_, i) => {
    const year = today.getFullYear() - (4 - i)
    const base = 1200000 + i * 270000
    return {
      label: String(year),
      sales: seededValue(year, base, 0.03),
    }
  })
}

export function buildSalesDataByRange(
  now: Date = new Date(),
): Record<SalesRangeKey, SalesTrendPoint[]> {
  return {
    '7d': buildDailyRange(now),
    monthly: buildMonthlyRange(now),
    yearly: buildYearlyRange(now),
  }
}

export const SALES_COMPARISON_LABEL: Record<SalesRangeKey, string> = {
  '7d': 'เทียบกับสัปดาห์ก่อน',
  monthly: 'เทียบกับช่วงก่อนหน้า',
  yearly: 'เทียบกับช่วงก่อนหน้า',
}

export function computeHalfOverHalfChangePct(
  points: SalesTrendPoint[],
): number {
  if (points.length < 2) return 0
  const mid = Math.ceil(points.length / 2)
  const firstHalf = points.slice(0, mid)
  const secondHalf = points.slice(mid)
  const sum = (arr: SalesTrendPoint[]) => arr.reduce((s, p) => s + p.sales, 0)
  const firstSum = sum(firstHalf)
  const secondSum = sum(secondHalf)
  if (firstSum === 0) return 0
  return ((secondSum - firstSum) / firstSum) * 100
}
