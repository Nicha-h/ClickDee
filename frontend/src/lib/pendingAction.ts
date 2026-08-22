import type { PendingAiAction } from '@/api/generated/client'

export function pendingActionSummary(action: NonNullable<PendingAiAction>): {
  label: string
  rows: [string, string][]
} {
  const { payload } = action
  if (action.type === 'DELETE') {
    return { label: 'ลบแคมเปญ', rows: [] }
  }
  const rows: [string, string][] = []
  if (payload.name) rows.push(['ชื่อแคมเปญ', payload.name])
  if (payload.budget !== undefined)
    rows.push(['งบประมาณ', `${payload.budget.toLocaleString('th-TH')} บาท`])
  if (payload.startDate) rows.push(['เริ่ม', payload.startDate])
  if (payload.endDate) rows.push(['สิ้นสุด', payload.endDate])
  if (payload.caption) rows.push(['แคปชั่น', payload.caption])
  return {
    label: action.type === 'CREATE' ? 'สร้างแคมเปญใหม่' : 'แก้ไขแคมเปญ',
    rows,
  }
}
