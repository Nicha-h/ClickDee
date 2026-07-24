import { useNavigate } from "react-router-dom";
import coffee from '@/assets/coffee.svg'
import rocket from '@/assets/rocket.svg'
import ppl from '@/assets/ppl.svg'
import increase from '@/assets/increase.svg'
import star from '@/assets/starcircle.svg'
import cash from '@/assets/cash.svg'
import click from '@/assets/click.svg'

function Home() {
  const navigate = useNavigate();
  {/** Summary data PLACEHOLDER*/}
  const reach = 12450
  const clickNum = 842
  const usedBudget = 12400
  const ROI = 11.5
  const handleClick = () => {
    navigate('/campaign');
  }
  return (
    <div className="min-w-full min-h-full">
      {/** Welcome Message + create campaign btn*/}
      <div className="flex flex-row items-center justify-between gap-5 p-10 ">
        <div className="flex flex-col items-start justify-start gap-2 font-thai font-semibold">
          <div className="text-4xl text-amalfidark">
            สวัสดีตอนเช้า ☀️ ทีมLulu!
          </div>
          <div className="text-xl">
            วันนี้ AI ดูแลโฆษณาให้คุณอยู่นะ ระบบกำลังทำงานอย่างเต็มที่เพื่อยอดขายของคุณ
          </div>
        </div>
        <div className="shrink-0">
          <button onClick={() => handleClick()}
            className=" bg-seaactive hover:bg-seadark text-white text-2xl
            font-thai font-semibold py-6 px-12 rounded-[19px] shadow-md hover:shadow-lg hover:scale-105 hover:cursor-pointer
            transition-all duration-200 ease-in-out">
            <img src={rocket} alt="Rocket" className="-ml-2 h-10 w-10 mr-4 inline-block text-white" />
            สร้างแคมเปญใหม่
          </button>
        </div>
      </div>
      {/** AI status box*/}
      <div className="flex flex-row items-center justify-between ml-10 w-7xl px-15  h-60 bg-sealight border-seadark border-2
      rounded-xl shadow-md">
        <div className="flex-1 flex flex-col gap-4">
          {/** AI Agent Status + time update */}
          <div className="flex flex-row items-center justify-start gap-2 font-thai font-semibold w-full -mt-4">
            {/** AI Agent Status TODO: Make this relate to the real AI status [active/inactive/error] with relative colors*/}
            <div className="flex items-center gap-2 text-lg text-amalfi py-2 px-4 bg-white border-2 border-black rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>
              AI Agent · กำลังทำงาน
            </div>
            <h2 className="text-sm ml-5">อัปเดทล่าสุด 2 ชั่วโมงที่แล้ว</h2>
          </div>
          {/** filler msg*/}
          <div className="flex flex-col items-start justify-start gap-2">
            <div className="text-2xl font-thai font-semibold text-amalfidark">
              วันนี้ น้องดีดูแลโฆษณาให้คุณอยู่นะคะ ☕
            </div>
            <div className="text-lg font-thai text-amalfi">
              ระบบกำลังทำงานเต็มที่เพื่อยอดขายของคุณ — วิเคราะห์ตลาด ปรับงบ และเขียนโฆษณาให้อัตโนมัติ แค่คลิกเดียว ก็สร้างแคมเปญใหม่ได้เลย
            </div>
          </div>
        </div>
        {/** coffee cup */}
        <div className="ml-26 mr-6 shrink-0">
          <img src={coffee} alt="Coffee" className="h-40 w-40" />
        </div>
      </div>
      {/** summary boxes*/}
      {/** TODO: Replace placeholder data with real-time metrics. Replace values with a variable instead of texts*/}
      <div className="flex flex-row items-center justify-between gap-5 ml-10 mt-10 w-7xl h-45">
        <div className="w-75 h-full px-4 py-2 border-2 rounded-xl border-[#8E98A8] shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row text-2xl font-thai text-amalfi font-semibold p-4">
            <img src={ppl} alt="People" className="h-9 w-9 inline-block mr-2 " />
            <h2 className="font-thai text-amalfi font-semibold">ยอดเข้าถึง</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-3xl text-citrusdark font-bold">{reach.toLocaleString()}</p>
            <div className="flex flex-row items-center justify-start gap-2 ml-4">
              <img src={increase} alt="Increase" className="h-6 w-6 inline-block" />
              <span className="text-lg font-thai text-citrusdark font-semibold">+8%</span>
            </div>
          </div>
          <div className="px-4">
            <p className="text-lg font-semibold font-thai text-black mt-2">
              คนเห็นโฆษณาของคุณ
            </p>
          </div>
        </div>        
        <div className="w-75 h-full px-4 py-2 border-2 rounded-xl border-[#8E98A8] shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row text-2xl font-thai text-amalfi font-semibold p-4">
            <img src={click} alt="click" className="h-9 w-9 inline-block mr-2 " />
            <h2 className="font-thai text-amalfi font-semibold">คลิก</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-3xl text-citrusdark font-bold">{clickNum.toLocaleString()}</p>
            <div className="flex flex-row items-center justify-start gap-2 ml-4">
              <img src={increase} alt="Increase" className="h-6 w-6 inline-block" />
              <span className="text-lg font-thai text-citrusdark font-semibold">+12%</span>
            </div>
          </div>
          <div className="px-4">
            <p className="text-lg font-semibold font-thai text-black mt-2">
              คนที่สนใจและกดดูร้าน
            </p>
          </div>
        </div>        
        <div className="w-75 h-full px-4 py-2 border-2 rounded-xl border-[#8E98A8] shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row text-2xl font-thai text-amalfi font-semibold p-4">
            <img src={cash} alt="Budget usage" className="h-9 w-9 inline-block mr-2 " />
            <h2 className="font-thai text-amalfi font-semibold">ยอดใช้จ่ายโฆษณา</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-3xl text-citrusdark font-bold">฿{usedBudget.toLocaleString()}</p>
            
          </div>
          <div className="px-4">
            <p className="text-lg font-semibold font-thai text-black mt-2">
              ของงบรายเดือน
            </p>
          </div>
        </div>        
        <div className="w-75 h-full px-4 py-2 border-2 rounded-xl border-[#8E98A8] bg-amalfi shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row justify-between text-2xl font-thai text-white font-semibold p-4">
            <h2 className="font-thai font-semibold">ROI</h2>
            <img src={star} alt="Budget usage" className="h-9 w-9 inline-block mr-2 " />
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-3xl text-white font-bold">{ROI.toFixed(1)}x</p>
            
          </div>
          <div className="px-4">
            <p className="text-lg font-semibold font-thai text-white mt-2">
              ผลตอบแทนดีเยี่ยม
            </p>
          </div>
        </div>  
      </div>
    </div>
  )
}

export default Home
