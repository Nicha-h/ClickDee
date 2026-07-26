import { CircleUserRound, Settings, Bell } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
function Topbar() {
  const [activeButton, setActiveButton] = useState('')
  const handleClick = (buttonName: string) => {
    setActiveButton(buttonName)
  }
  return (
    <div className="sticky top-0 flex h-20 w-full flex-row items-center justify-end bg-white px-2">
      <div className="mr-11 flex flex-row items-center justify-end gap-10 pt-4">
        <NavLink to="/notification" onClick={() => handleClick('bell')}>
          {/* TODO: notification gonna be a modal. Dont forget to fix the notification */}
          <Bell
            className={`h-10 w-10 text-[#8E98A8] transition-all hover:-translate-y-0.5 hover:scale-105 hover:cursor-pointer hover:text-[#6B7280] ${activeButton === 'bell' ? 'text-[#000000]' : ''}`}
          />
        </NavLink>
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
