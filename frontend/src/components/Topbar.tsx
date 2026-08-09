import { CircleUserRound, Settings, Bell, Menu } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { NavLink } from 'react-router-dom'
import NotificationPanel, {
  type NotificationItem,
} from '@/components/notificationPanel'
import Portal from '@/components/portal'
import useScrollHidden from '@/components/useScrollHidden'

{
  /** Notification data PLACEHOLDER */
}
const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    text: "แคมเปญ 'ดีลฝนพรำ ลาเต้+ครัวซองต์' เริ่มทำงานแล้ว",
    time: '2 ชั่วโมงที่แล้ว',
    read: false,
  },
  {
    id: 'n2',
    text: 'งบประมาณใกล้ถึงเพดานที่ตั้งไว้ (80%)',
    time: 'เมื่อวาน',
    read: false,
  },
  {
    id: 'n3',
    text: 'น้องดี AI มีไอเดียแคมเปญใหม่ให้คุณ',
    time: '2 วันที่แล้ว',
    read: true,
  },
]

const NOTIF_PANEL_GAP = 8
const NOTIF_PANEL_MARGIN = 16

function Topbar({
  containerRef,
  onMenuClick,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  onMenuClick: () => void
}) {
  const hidden = useScrollHidden(containerRef)
  const [activeButton, setActiveButton] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [notifPos, setNotifPos] = useState({ top: 0, left: 0 })
  const bellRef = useRef<HTMLButtonElement>(null)
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const handleClick = (buttonName: string) => {
    setActiveButton(buttonName)
  }
  const hasUnread = notifications.some((n) => !n.read)
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Anchor the dropdown to the bell's real screen position, matching the
  // credit popover's approach: the panel is portaled to document.body so it
  // always paints above page content, so it can no longer rely on CSS
  // absolute/relative positioning against its original React parent.
  useLayoutEffect(() => {
    if (!notifOpen) return
    const bell = bellRef.current
    if (!bell) return
    const bellRect = bell.getBoundingClientRect()
    const panelWidth = notifPanelRef.current?.offsetWidth ?? 0
    const maxLeft = window.innerWidth - panelWidth - NOTIF_PANEL_MARGIN
    setNotifPos({
      top: bellRect.bottom + NOTIF_PANEL_GAP,
      left: Math.max(
        NOTIF_PANEL_MARGIN,
        Math.min(bellRect.right - panelWidth, maxLeft),
      ),
    })
  }, [notifOpen])

  return (
    <div
      className={`sticky top-0 z-10 flex h-20 w-full shrink-0 flex-row items-center justify-between bg-white px-2 transition-transform duration-300 ease-in-out lg:translate-y-0 lg:justify-end ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="ml-2 flex items-center justify-center p-0 lg:hidden"
      >
        <Menu className="h-8 w-8 text-[#8E98A8] transition-all hover:text-[#6B7280]" />
      </button>
      <div className="mr-11 flex flex-row items-center justify-end gap-10 pt-4">
        <div className="relative">
          <button
            ref={bellRef}
            type="button"
            onClick={() => {
              handleClick('bell')
              setNotifOpen((open) => !open)
            }}
            className="relative flex items-center justify-center p-0"
          >
            <Bell
              className={`h-10 w-10 text-[#8E98A8] transition-all hover:-translate-y-0.5 hover:scale-105 hover:cursor-pointer hover:text-[#6B7280] ${activeButton === 'bell' ? 'text-[#000000]' : ''}`}
            />
            {hasUnread && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#E07070]" />
            )}
          </button>
          {notifOpen && (
            <Portal>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <NotificationPanel
                notifications={notifications}
                onMarkAllRead={markAllRead}
                panelRef={notifPanelRef}
                style={{ top: notifPos.top, left: notifPos.left, zIndex: 50 }}
              />
            </Portal>
          )}
        </div>
        <NavLink to="/setting" onClick={() => handleClick('settings')}>
          <Settings
            className={`h-10 w-10 text-[#8E98A8] transition-all hover:-translate-y-0.5 hover:scale-105 hover:cursor-pointer hover:text-[#6B7280] ${activeButton === 'settings' ? 'text-[#000000]' : ''}`}
          />
        </NavLink>
        <NavLink to="/account" onClick={() => handleClick('user')}>
          <CircleUserRound
            className={`h-10 w-10 text-[#8E98A8] transition-all hover:-translate-y-0.5 hover:scale-105 hover:cursor-pointer hover:text-[#6B7280] ${activeButton === 'user' ? 'text-[#000000]' : ''}`}
          />
        </NavLink>
      </div>
    </div>
  )
}

export default Topbar
