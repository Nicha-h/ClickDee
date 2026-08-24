import type { ResetPeriod } from '@/data/tiers'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function formatResetLabel(
  resetPeriod: ResetPeriod,
  now: Date = new Date(),
): string {
  if (resetPeriod === 'lifetime') return 'One-time'

  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const msPerDay = 24 * 60 * 60 * 1000
  const daysLeft = Math.ceil((nextReset.getTime() - now.getTime()) / msPerDay)
  const dateLabel = `${MONTH_LABELS[nextReset.getMonth()]} ${nextReset.getDate()}`
  return `Resets in ${daysLeft} days (${dateLabel})`
}

export function progressBarColor(used: number, total: number): string {
  if (total <= 0) return '#fed717'
  const pct = (used / total) * 100
  if (pct >= 100) return '#D92A2A'
  if (pct >= 80) return '#F59E0B'
  return '#fed717'
}
