import { useNavigate } from 'react-router-dom'
import facebookLogoTile from '@/assets/facebook-logo-tile.png'

function Integration() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full min-w-full p-10">
      <h1 className="font-thai text-amalfidark text-4xl font-bold">
        การเชื่อมต่อ
      </h1>
      <p className="font-thai mt-4 max-w-263.75 text-xl text-black">
        เชื่อมต่อช่องทางการตลาดและแพลตฟอร์มอีคอมเมิร์ซปัจจุบันของคุณ
        เพื่อขับเคลื่อนระบบ AI ด้วยข้อมูลแบบเรียลไทม์และการเผยแพร่โฆษณาอัตโนมัติ
      </p>
      <div className="relative mt-8 flex min-h-54.75 w-full max-w-247.5 items-center rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-6">
          <img
            src={facebookLogoTile}
            alt="Facebook"
            className="h-31 w-31 rounded-xl object-cover"
          />
          <div>
            <p className="font-eng text-3xl font-semibold text-black">
              Facebook
            </p>
            <p className="font-thai text-amalfidark mt-1 text-base font-semibold">
              ซิงค์เพจและบัญชีโฆษณา
            </p>
          </div>
        </div>
        <p className="font-thai absolute top-6 right-6 text-xl font-semibold text-[#519b5c]">
          เชื่อมต่อแล้ว
        </p>
        <button
          type="button"
          onClick={() => navigate('/integration/facebook')}
          className="font-thai border-seadark bg-sealight-hover text-seadark absolute right-6 bottom-6 h-12.5 w-32.75 
          rounded-full border-2 text-2xl font-semibold hover:bg-sealight-active hover:scale-105 hover:cursor-pointer transition-all"
        >
          แก้ไข
        </button>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default Integration
