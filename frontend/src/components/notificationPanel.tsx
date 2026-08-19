import type { CSSProperties, Ref } from 'react'
import { X } from 'lucide-react'

export type NotificationItem = {
  id: string
  text: string
  time: string
  read: boolean
  link: string | null
  pendingActionId: string | null
  pendingActionStatus: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'EXPIRED' | null
}

type NotificationPanelProps = {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
  onItemClick: (notification: NotificationItem) => void
  onCancel: (notification: NotificationItem) => void
  panelRef?: Ref<HTMLDivElement>
  style?: CSSProperties
}

function NotificationPanel({
  notifications,
  onMarkAllRead,
  onItemClick,
  onCancel,
  panelRef,
  style,
}: NotificationPanelProps) {
  return (
    <div
      ref={panelRef}
      style={style}
      className="fixed z-30 w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#8E98A8] bg-white shadow-[0px_8px_32px_0px_rgba(0,0,0,0.18)] sm:w-100"
    >
      <div className="flex items-center justify-between border-b border-[#F0ECF7] px-5 py-4.5">
        <span className="font-thai text-xl font-bold text-[#1F2937]">
          การแจ้งเตือน
        </span>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="font-thai text-amalfidark hover:text-amalfidarker text-base font-semibold"
        >
          เปลี่ยนเป็นอ่านแล้วทั้งหมด
        </button>
      </div>
      <div className="max-h-90 overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => onItemClick(n)}
            className={`group relative flex cursor-pointer gap-3 border-b border-[#F6F4FB] px-5 py-4 hover:bg-[#F6F4FB] ${n.read ? 'bg-white' : 'bg-amalfilight/40'}`}
          >
            <div
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-[#E4E1EC]' : 'bg-amalfidark'}`}
            />
            <div className="pr-8">
              <p className="font-thai text-base leading-normal font-medium text-[#1F2937]">
                {n.text}
              </p>
              <p className="font-thai mt-1 text-lg text-[#9AA5B1]">{n.time}</p>
            </div>
            {n.pendingActionId && n.pendingActionStatus === 'PENDING' && (
              <button
                type="button"
                aria-label="ยกเลิก"
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel(n)
                }}
                className="absolute top-4 right-4 rounded-full p-1 text-[#9AA5B1] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#E4E1EC] hover:text-[#1F2937]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationPanel
