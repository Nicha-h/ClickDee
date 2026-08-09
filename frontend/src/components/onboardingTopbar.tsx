import logo from '@/assets/logos/logoBY.svg'

function OnboardingTopbar() {
  return (
    <div className="flex h-16 w-full shrink-0 items-center justify-center gap-3 px-4 sm:h-20 sm:px-6 lg:h-24 lg:px-10">
      <img src={logo} alt="ClickDee" className="h-10 w-10 sm:h-13 sm:w-13" />
      <p className="font-eng text-amalfidark text-xl font-bold sm:text-2xl">
        ClickDee
      </p>
    </div>
  )
}

export default OnboardingTopbar
