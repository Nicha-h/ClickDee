import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import home from '@/assets/icons/home.svg'
import robot from '@/assets/icons/robot.svg'
import rocket from '@/assets/icons/rocket.svg'
import stats from '@/assets/icons/stats.svg'
import account from '@/assets/icons/account.svg'
import logout from '@/assets/icons/logout.svg'
import sparklebold from '@/assets/icons/sparklebold.svg'
import logo from '@/assets/logos/logo.svg'
import CreditPanel, { type CreditUsage } from '@/components/creditPanel'
import Portal from '@/components/portal'
{
  /* placeholder for AI token management */
}
const AI_TOKEN = 100
const AI_TOKEN_MAX = 200

{
  /** Credit usage breakdown PLACEHOLDER */
}
const creditUsage: CreditUsage[] = [
  { label: 'สร้างแคมเปญ (Campaign generation)', used: 68, total: 100 },
  { label: 'สร้างภาพโฆษณา (Image generation)', used: 54, total: 70 },
  { label: 'สร้างวิดีโอ (Video generation)', used: 20, total: 30 },
]

function Navbar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeButton, setActiveButton] = useState('Home')
  const [creditOpen, setCreditOpen] = useState(false)
  const handleClick = (buttonName: string) => {
    setActiveButton(buttonName)
  }

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <Portal>
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out lg:hidden ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={onClose}
        />
      </Portal>
      <nav
        className={`bg-amalfi fixed inset-y-0 left-0 z-50 flex h-screen w-80 -translate-x-full flex-col justify-between gap-6 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        <div className="grid justify-start gap-3">
          {/** logo */}
          <div className="bg-amalfi flex h-20 w-79 p-3 text-4xl">
            <NavLink
              to="/home"
              onClick={() => handleClick('home')}
              className="font-jakarta flex items-center justify-center gap-4 p-3 pt-5 text-4xl font-bold text-white"
            >
              <img src={logo} alt="ClickDee" className="h-16 w-16" />
              <p className="text-white">ClickDee</p>
            </NavLink>
            {/** navigation btns */}
          </div>
          <NavLink
            to="/home"
            onClick={() => handleClick('home')}
            className={`mx-5 flex h-16 w-70 items-center justify-start rounded-2xl p-7 transition-colors duration-200 hover:-translate-x-0.5 ${
              activeButton === 'home'
                ? 'bg-citrus-light hover:bg-citrus-light-hover'
                : 'bg-amalfi hover:bg-amalfihover'
            } font-thai text-xl font-semibold ${activeButton === 'home' ? 'text-black' : 'text-white'}`}
          >
            <div className="flex items-center gap-6">
              <img
                src={home}
                alt="Home"
                className={`h-6 w-6 ${activeButton === 'home' ? 'brightness-0' : ''}`}
              />
              หน้าหลัก
            </div>
          </NavLink>
          <NavLink
            to="/campaign"
            onClick={() => handleClick('campaign')}
            className={`mx-5 flex h-16 w-70 items-center justify-start rounded-2xl p-7 transition-colors duration-200 hover:-translate-x-0.5 ${activeButton === 'campaign' ? 'bg-citrus-light hover:bg-citrus-light-hover' : 'bg-amalfi hover:bg-amalfihover'} font-thai text-xl font-semibold ${activeButton === 'campaign' ? 'text-black' : 'text-white'}`}
          >
            <div className="flex items-center gap-6">
              <img
                src={rocket}
                alt="Campaign"
                className={`h-6 w-6 ${activeButton === 'campaign' ? 'brightness-0' : ''}`}
              />
              แคมเปญ
            </div>
          </NavLink>
          <NavLink
            to="/ai"
            onClick={() => handleClick('ai')}
            className={`mx-5 flex h-16 w-70 items-center justify-start rounded-2xl p-7 transition-colors duration-200 hover:-translate-x-0.5 ${activeButton === 'ai' ? 'bg-citrus-light hover:bg-citrus-light-hover' : 'bg-amalfi hover:bg-amalfihover'} font-thai text-xl font-semibold ${activeButton === 'ai' ? 'text-black' : 'text-white'}`}
          >
            <div className="flex items-center gap-6">
              <img
                src={robot}
                alt="AI"
                className={`h-6 w-6 ${activeButton === 'ai' ? 'brightness-0' : ''}`}
              />
              ที่ปรึกษา AI
            </div>
          </NavLink>
          <NavLink
            to="/overview"
            onClick={() => handleClick('overview')}
            className={`mx-5 flex h-16 w-70 items-center justify-start rounded-2xl p-7 transition-colors duration-200 hover:-translate-x-0.5 ${activeButton === 'overview' ? 'bg-citrus-light hover:bg-citrus-light-hover' : 'bg-amalfi hover:bg-amalfihover'} font-thai text-xl font-semibold ${activeButton === 'overview' ? 'text-black' : 'text-white'}`}
          >
            <div className="flex items-center gap-6">
              <img
                src={stats}
                alt="Overview"
                className={`h-6 w-6 ${activeButton === 'overview' ? 'brightness-0' : ''}`}
              />
              รายงาน
            </div>
          </NavLink>
          <NavLink
            to="/integration"
            onClick={() => handleClick('integration')}
            className={`mx-5 flex h-16 w-70 items-center justify-start rounded-2xl p-7 transition-colors duration-200 hover:-translate-x-0.5 ${activeButton === 'integration' ? 'bg-citrus-light hover:bg-citrus-light-hover' : 'bg-amalfi hover:bg-amalfihover'} font-thai text-xl font-semibold ${activeButton === 'integration' ? 'text-black' : 'text-white'}`}
          >
            <div className="flex items-center gap-6">
              <img
                src={account}
                alt="Integration"
                className={`h-6 w-6 ${activeButton === 'integration' ? 'brightness-0' : ''}`}
              />
              การเชื่อมต่อ
            </div>
          </NavLink>
        </div>
        <div className="mb-5 grid items-end justify-center gap-2 p-4">
          <div className="relative mx-5 w-70">
            <div
              onClick={() => setCreditOpen((open) => !open)}
              className="font-thai h-50 w-70 cursor-pointer items-center justify-start rounded-2xl border-3 border-white/30 bg-white/10 p-7 text-2xl text-white shadow-lg backdrop-blur-md"
            >
              <div>
                <div className="text-2lg mb-2 flex items-center gap-2 font-semibold">
                  <img src={sparklebold} alt="Sparkle" className="h-6 w-6" />
                  AI Token
                </div>
                <div className="text-base font-semibold">
                  เหลือ {AI_TOKEN} / {AI_TOKEN_MAX} tokens
                </div>
                <div className="py-2 text-base font-bold">
                  เดือนนี้ใช้งานไปแล้ว
                </div>

                {/* TODO: come fix this later */}
                <div className="h-2 w-full rounded-full bg-white/20">
                  <div
                    className="bg-citrus h-2 rounded-full"
                    style={{ width: `${(AI_TOKEN / AI_TOKEN_MAX) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <CreditPanel
              open={creditOpen}
              onClose={() => setCreditOpen(false)}
              usage={creditUsage}
            />
          </div>
          {/** logout btn */}
          <NavLink
            to="/login"
            onClick={() => handleClick('logout')}
            className={`font-thai mx-5 flex h-16 w-70 items-center justify-start rounded-2xl p-7 text-xl text-white transition-transform duration-200 hover:-translate-x-0.5`}
          >
            <div className="flex items-center gap-6 pt-5">
              <img
                src={logout}
                alt="Logout"
                className={`h-5 w-5 ${activeButton === 'logout' ? 'brightness-0' : ''} `}
              />
              ออกจากระบบ
            </div>
          </NavLink>
        </div>
      </nav>
    </>
  )
}

export default Navbar
