import type { ReactNode } from 'react'
import logo from '@/assets/logos/logo.svg'
import ellipseTop from '@/assets/decorative/auth-ellipse-top.svg'
import ellipseBottom from '@/assets/decorative/auth-ellipse-bottom.svg'

type AuthBrandPanelProps = {
  title: ReactNode
  description: string
}

function AuthBrandPanel({ title, description }: AuthBrandPanelProps) {
  return (
    <div className="bg-amalfidark relative hidden h-screen w-2/5 min-w-120 shrink-0 overflow-hidden lg:block">
      <img
        src={ellipseTop}
        alt=""
        className="absolute top-30 left-35 h-105 w-105"
      />
      <img
        src={ellipseBottom}
        alt=""
        className="absolute top-190 right-20 h-75 w-75"
      />
      <div className="relative flex items-center gap-4 p-14 pb-0">
        <img src={logo} alt="ClickDee" className="h-14 w-14" />
        <p className="font-eng text-3xl font-bold text-[#f8f4eb]">ClickDee</p>
      </div>
      <div className="relative flex h-200 flex-col justify-center">
        <div className="font-thai relative mt-25 flex flex-col gap-2 px-14 text-5xl leading-tight font-bold text-white">
          {title}
        </div>
        <p className="font-thai text-amalfilight-hover relative mt-9 max-w-110 px-14 text-lg leading-relaxed">
          {description}
        </p>
        <div className="relative mx-14 mt-15 inline-flex w-fit items-start rounded-full bg-white/12 px-5 py-3">
          <p className="font-thai text-base whitespace-nowrap text-white">
            เริ่มต้นเพียง 490 บาท/เดือน ไม่ต้องมีทีมการตลาด
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthBrandPanel
