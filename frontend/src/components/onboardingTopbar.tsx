import logo from '@/assets/logos/logoBY.svg'

function OnboardingTopbar() {
  return (
    <div className="flex h-24 w-full shrink-0 items-center justify-center gap-3 px-10">
      <img src={logo} alt="ClickDee" className="h-13 w-13" />
      <p className="font-eng text-amalfidark text-2xl font-bold">ClickDee</p>
    </div>
  )
}

export default OnboardingTopbar
