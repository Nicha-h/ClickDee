import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import home from '@/assets/home.svg'
import robot from '@/assets/robot.svg'
import rocket from '@/assets/rocket.svg'
import stats from '@/assets/stats.svg'
import account from '@/assets/account.svg'

function Navbar() {
  const [activeButton, setActiveButton] = useState('Home')
  const handleClick = (buttonName: string) => {
    setActiveButton(buttonName)
  }

  return (
    <nav className="bg-amalfi sticky top-0 flex h-screen w-79 flex-col justify-between gap-6">
      <div className="grid justify-start gap-3">
        <div className="bg-amalfi h-30 w-79 p-3 text-4xl">
          <div className="flex items-end justify-end p-3 pt-12 text-white">
            TEST
          </div>
        </div>
        <NavLink
          to="/home"
          onClick={() => handleClick('home')}
          className={`mx-5 flex h-19 w-70 items-center justify-start rounded-2xl p-7 ${activeButton === 'home' ? 'bg-citrus-light' : 'bg-amalfi'} font-thai text-2xl font-semibold ${activeButton === 'home' ? 'text-black' : 'text-white'}`}
        >
          <div className="flex items-center gap-6">
            <img
              src={home}
              alt="Home"
              className={`h-8 w-8 ${activeButton === 'home' ? 'brightness-0' : ''}`}
            />
            หน้าหลัก
          </div>
        </NavLink>
        <NavLink
          to="/campaign"
          onClick={() => handleClick('campaign')}
          className={`mx-5 flex h-19 w-70 items-center justify-start rounded-2xl p-7 ${activeButton === 'campaign' ? 'bg-citrus-light' : 'bg-amalfi'} font-thai text-semibold text-2xl ${activeButton === 'campaign' ? 'text-black' : 'text-white'}`}
        >
          <div className="flex items-center gap-6">
            <img
              src={rocket}
              alt="Campaign"
              className={`h-8 w-8 ${activeButton === 'campaign' ? 'brightness-0' : ''}`}
            />
            แคมเปญ
          </div>
        </NavLink>
        <NavLink
          to="/ai"
          onClick={() => handleClick('ai')}
          className={`mx-5 flex h-19 w-70 items-center justify-start rounded-2xl p-7 ${activeButton === 'ai' ? 'bg-citrus-light' : 'bg-amalfi'} font-thai text-semibold text-2xl ${activeButton === 'ai' ? 'text-black' : 'text-white'}`}
        >
          <div className="flex items-center gap-6">
            <img
              src={robot}
              alt="AI"
              className={`h-8 w-8 ${activeButton === 'ai' ? 'brightness-0' : ''}`}
            />
            ที่ปรึกษา AI
          </div>
        </NavLink>
        <NavLink
          to="/overview"
          onClick={() => handleClick('overview')}
          className={`mx-5 flex h-19 w-70 items-center justify-start rounded-2xl p-7 ${activeButton === 'overview' ? 'bg-citrus-light' : 'bg-amalfi'} font-thai text-semibold text-2xl ${activeButton === 'overview' ? 'text-black' : 'text-white'}`}
        >
          <div className="flex items-center gap-6">
            <img
              src={stats}
              alt="Overview"
              className={`h-8 w-8 ${activeButton === 'overview' ? 'brightness-0' : ''}`}
            />
            รายงาน
          </div>
        </NavLink>
        <NavLink
          to="/integration"
          onClick={() => handleClick('integration')}
          className={`mx-5 flex h-19 w-70 items-center justify-start rounded-2xl p-7 ${activeButton === 'integration' ? 'bg-citrus-light' : 'bg-amalfi'} font-thai text-semibold text-2xl ${activeButton === 'integration' ? 'text-black' : 'text-white'}`}
        >
          <div className="flex items-center gap-6">
            <img
              src={account}
              alt="Integration"
              className={`h-8 w-8 ${activeButton === 'integration' ? 'brightness-0' : ''}`}
            />
            การเชื่อมต่อ
          </div>
        </NavLink>
      </div>
      <div className="grid items-end justify-center gap-3 p-6">
        <div className="mx-6 h-30 w-65 rounded-2xl bg-amber-500"></div>
        <NavLink
          to="/logout"
          onClick={() => handleClick('logout')}
          className={`mx-6 h-20 w-65 rounded-2xl ${activeButton === 'logout' ? 'bg-citrus-light' : 'bg-amalfi'} font-thai text-2xl text-white`}
        >
          ออกจากระบบ
        </NavLink>
      </div>
    </nav>
  )
}

export default Navbar
