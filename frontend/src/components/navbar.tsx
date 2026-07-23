import { useState } from "react"
import { NavLink } from "react-router-dom"
import home from "@/assets/home.svg"
import robot from "@/assets/robot.svg"
import rocket from "@/assets/rocket.svg"
import stats from "@/assets/stats.svg"
import account from "@/assets/account.svg"

function Navbar() {
  const [activeButton, setActiveButton] = useState('Home');
  const handleClick = (buttonName: string) => {
    setActiveButton(buttonName);
  }

  return (
    <nav className="sticky top-0 w-79 h-screen flex flex-col justify-between gap-6 bg-amalfi">
      <div className="grid justify-start gap-3">
        <div className="w-79 h-30 bg-amalfi p-3 text-4xl">
            <div className="flex justify-end items-end pt-12 p-3 text-white">TEST</div></div>
        <NavLink to="/home" onClick={() => handleClick('home')} className={`mx-5 w-70 h-19 rounded-2xl flex items-center justify-start p-7
          ${activeButton === 'home' ? "bg-citrus-light" : "bg-amalfi"} font-thai font-semibold text-2xl ${activeButton === 'home' ? "text-black" : "text-white"}`}>
          <div className="flex items-center gap-6">
            <img src={home} alt="Home" className={`w-8 h-8 ${activeButton === 'home' ? "brightness-0" : ""}`} />
            หน้าหลัก
          </div>
        </NavLink>
        <NavLink to="/campaign" onClick={() => handleClick('campaign')} className={`mx-5 w-70 h-19 rounded-2xl flex items-center justify-start p-7 
          ${activeButton === 'campaign' ? "bg-citrus-light" : "bg-amalfi"} font-thai text-2xl text-semibold ${activeButton === 'campaign' ? "text-black" : "text-white"}`}>
          <div className="flex items-center gap-6">
            <img src={rocket} alt="Campaign" className={`w-8 h-8 ${activeButton === 'campaign' ? "brightness-0" : ""}`} />
            แคมเปญ
          </div>
        </NavLink>
        <NavLink to="/ai" onClick={() => handleClick('ai')} className={`mx-5 w-70 h-19 rounded-2xl flex items-center justify-start p-7 ${activeButton === 'ai' ? "bg-citrus-light" : "bg-amalfi"} font-thai text-2xl text-semibold ${activeButton === 'ai' ? "text-black" : "text-white"}`}>
          <div className="flex items-center gap-6">
            <img src={robot} alt="AI" className={`w-8 h-8 ${activeButton === 'ai' ? "brightness-0" : ""}`} />
            ที่ปรึกษา AI
          </div>
        </NavLink>
        <NavLink to="/overview" onClick={() => handleClick('overview')} className={`mx-5 w-70 h-19 rounded-2xl flex items-center justify-start p-7 ${activeButton === 'overview' ? "bg-citrus-light" : "bg-amalfi"} font-thai text-2xl text-semibold ${activeButton === 'overview' ? "text-black" : "text-white"}`}>
          <div className="flex items-center gap-6">
            <img src={stats} alt="Overview" className={`w-8 h-8 ${activeButton === 'overview' ? "brightness-0" : ""}`} />
            รายงาน
          </div>
        </NavLink>
        <NavLink to="/integration" onClick={() => handleClick('integration')} className={`mx-5 w-70 h-19 rounded-2xl flex items-center justify-start p-7 ${activeButton === 'integration' ? "bg-citrus-light" : "bg-amalfi"} font-thai text-2xl text-semibold ${activeButton === 'integration' ? "text-black" : "text-white"}`}>
          <div className="flex items-center gap-6">
            <img src={account} alt="Integration" className={`w-8 h-8 ${activeButton === 'integration' ? "brightness-0" : ""}`} />
            การเชื่อมต่อ
          </div>
        </NavLink>
      </div>
      <div className="grid justify-center items-end gap-3 p-6">
        <div className="mx-6 w-65 h-30 bg-amber-500 rounded-2xl"></div>
        <NavLink to="/logout" onClick={() => handleClick('logout')} className={`mx-6 w-65 h-20 rounded-2xl ${activeButton === 'logout' ? "bg-citrus-light" : "bg-amalfi"} font-thai text-2xl text-white`}>ออกจากระบบ</NavLink>
      </div>
    </nav>
  )
}

export default Navbar
