import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Login from '@/pages/login'
import SignUp from '@/pages/signup'
import Onboarding from '@/pages/onboarding'
import OnboardingProcessing from '@/pages/onboardingProcessing'
import OnboardingPersonalize from '@/pages/onboardingPersonalize'
import OnboardingDone from '@/pages/onboardingDone'
import Home from '@/pages/home'
import Campaign from '@/pages/campaign'
import CampaignReport from '@/pages/campaignReport'
import CampaignCreate from '@/pages/campaignCreate'
import CampaignProcessing from '@/pages/campaignProcessing'
import CampaignReview from '@/pages/campaignReview'
import CampaignEdit from '@/pages/campaignEdit'
import CreativeCreate from '@/pages/creativeCreate'
import CreativeProcessing from '@/pages/creativeProcessing'
import Ai from '@/pages/ai'
import Overview from '@/pages/overview'
import Integration from '@/pages/integration'
import IntegrationFacebook from '@/pages/integrationFacebook'
import Account from '@/pages/account'
import Setting from '@/pages/setting'
import Topbar from '@/components/Topbar'
import ScrollToTopButton from '@/components/scrollToTopButton'
import DashboardTransitionLoader from '@/components/dashboardTransitionLoader'

const TRANSITION_DURATION_MS = 750

const DashboardLayout = () => {
  const { pathname } = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const previousPathname = useRef(pathname)
  const [transitioning, setTransitioning] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0)

    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    setNavOpen(false)
    setTransitioning(true)
    const timeout = setTimeout(
      () => setTransitioning(false),
      TRANSITION_DURATION_MS,
    )
    return () => clearTimeout(timeout)
  }, [pathname])

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <Navbar open={navOpen} onClose={() => setNavOpen(false)} />
      <div
        ref={scrollContainerRef}
        className="relative flex h-screen flex-1 flex-col overflow-y-auto"
      >
        <Topbar
          containerRef={scrollContainerRef}
          onMenuClick={() => setNavOpen(true)}
        />
        <div
          key={pathname}
          className="animate-[fade-in_0.25s_ease-out] px-4 md:px-8 lg:px-10"
        >
          <Outlet />
        </div>
        <DashboardTransitionLoader visible={transitioning} />
      </div>
      <ScrollToTopButton containerRef={scrollContainerRef} />
    </div>
  )
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/processing" element={<OnboardingProcessing />} />
      <Route
        path="/onboarding/personalize"
        element={<OnboardingPersonalize />}
      />
      <Route path="/onboarding/done" element={<OnboardingDone />} />
      <Route element={<DashboardLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/campaign" element={<Campaign />} />
        <Route path="/campaign/new" element={<CampaignCreate />} />
        <Route
          path="/campaign/new/processing"
          element={<CampaignProcessing />}
        />
        <Route path="/campaign/new/review" element={<CampaignReview />} />
        <Route
          path="/campaign/:campaignId/report"
          element={<CampaignReport />}
        />
        <Route path="/campaign/:campaignId/edit" element={<CampaignEdit />} />
        <Route
          path="/campaign/:campaignId/creative/new"
          element={<CreativeCreate />}
        />
        <Route
          path="/campaign/:campaignId/creative/new/processing"
          element={<CreativeProcessing />}
        />
        <Route path="/ai" element={<Ai />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/integration" element={<Integration />} />
        <Route path="/integration/facebook" element={<IntegrationFacebook />} />
        <Route path="/account" element={<Account />} />
        <Route path="/setting" element={<Setting />} />
      </Route>
    </Routes>
  )
}

export default App
