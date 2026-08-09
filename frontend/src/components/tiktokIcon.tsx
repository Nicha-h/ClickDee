import tiktok1 from '@/assets/logos/tiktok-1.svg'
import tiktok2 from '@/assets/logos/tiktok-2.svg'
import tiktok3 from '@/assets/logos/tiktok-3.svg'
import tiktok4 from '@/assets/logos/tiktok-4.svg'
import tiktok5 from '@/assets/logos/tiktok-5.svg'

function TiktokIcon({ className }: { className?: string }) {
  return (
    <div className={`relative ${className ?? 'h-8.5 w-7.5'}`}>
      <div className="absolute inset-[35.18%_61.06%_9.67%_0]">
        <img alt="" className="block size-full max-w-none" src={tiktok1} />
      </div>
      <div className="absolute inset-[0_5.44%_16.47%_27.04%]">
        <img alt="" className="block size-full max-w-none" src={tiktok2} />
      </div>
      <div className="absolute inset-[4.18%_19.56%_22.24%_18.64%]">
        <img alt="" className="block size-full max-w-none" src={tiktok3} />
      </div>
      <div className="absolute inset-[26.59%_0_0_14.65%]">
        <img alt="" className="block size-full max-w-none" src={tiktok4} />
      </div>
      <div className="absolute inset-[4.18%_5.44%_4.18%_5.43%]">
        <img alt="" className="block size-full max-w-none" src={tiktok5} />
      </div>
    </div>
  )
}

export default TiktokIcon
