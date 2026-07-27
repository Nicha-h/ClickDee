import type { CSSProperties, Ref } from 'react'

export type NotificationItem = {
  id: string
  text: string
  time: string
  read: boolean
}

type NotificationPanelProps = {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
  panelRef?: Ref<HTMLDivElement>
  style?: CSSProperties
}

function NotificationPanel({
  notifications,
  onMarkAllRead,
  panelRef,
  style,
}: NotificationPanelProps) {
  return (
    <div
      ref={panelRef}
      style={style}
      className="fixed z-30 w-100 overflow-hidden rounded-2xl border border-[#8E98A8] bg-white shadow-[0px_8px_32px_0px_rgba(0,0,0,0.18)]"
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
            className={`flex gap-3 border-b border-[#F6F4FB] px-5 py-4 ${n.read ? 'bg-white' : 'bg-amalfilight/40'}`}
          >
            <div
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-[#E4E1EC]' : 'bg-amalfidark'}`}
            />
            <div>
              <p className="font-thai text-base leading-normal font-medium text-[#1F2937]">
                {n.text}
              </p>
              <p className="font-thai mt-1 text-lg text-[#9AA5B1]">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationPanel
