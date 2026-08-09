import googleIcon from '@/assets/logos/google-icon.svg'
import facebookIconBg from '@/assets/logos/facebook-icon-bg.svg'
import facebookIconF from '@/assets/logos/facebook-icon-f.svg'

// TODO: wire up Google/Facebook OAuth once an auth provider is configured
function AuthSocialButtons() {
  return (
    <>
      <div className="flex h-5 w-full items-center justify-center gap-3">
        <div className="bg-amalfilight-hover h-px flex-1" />
        <p className="font-thai text-sm text-[#8E98A8]">หรือ</p>
        <div className="bg-amalfilight-hover h-px flex-1" />
      </div>
      <div className="flex w-full items-start gap-4">
        <button
          type="button"
          className="border-amalfilight-hover flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] bg-white px-4 py-3.5 hover:cursor-pointer hover:bg-[#f5f5f5]"
        >
          <img src={googleIcon} alt="" className="h-7 w-7" />
          <p className="font-thai text-base font-medium text-[#232323]">
            Google
          </p>
        </button>
        <button
          type="button"
          className="border-amalfilight-hover flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] bg-white px-4 py-3.5 hover:cursor-pointer hover:bg-[#f5f5f5]"
        >
          <span className="relative inline-block h-8.75 w-8.75 shrink-0">
            <img
              src={facebookIconBg}
              alt=""
              className="absolute inset-0 h-full w-full"
            />
            <img
              src={facebookIconF}
              alt=""
              className="absolute top-[18%] left-[41%] h-[82%] w-[41%]"
            />
          </span>
          <p className="font-thai text-base font-medium text-[#232323]">
            Facebook
          </p>
        </button>
      </div>
    </>
  )
}

export default AuthSocialButtons
