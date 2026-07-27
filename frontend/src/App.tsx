import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Home from '@/pages/home'
import Campaign from '@/pages/campaign'
import CampaignReport from '@/pages/campaignReport'
import CampaignCreate from '@/pages/campaignCreate'
import CampaignProcessing from '@/pages/campaignProcessing'
import CampaignReview from '@/pages/campaignReview'
import Ai from '@/pages/ai'
import Overview from '@/pages/overview'
import Integration from '@/pages/integration'
import IntegrationFacebook from '@/pages/integrationFacebook'
import Account from '@/pages/account'
import Setting from '@/pages/setting'
import Topbar from '@/components/Topbar'

const App = () => {
  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <Navbar />
      <div className="flex h-screen flex-1 flex-col overflow-y-auto">
        <Topbar />
        <div className="px-10">
          <Routes>
            <Route path="/" element={<Home />} />
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
            <Route path="/ai" element={<Ai />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/integration" element={<Integration />} />
            <Route
              path="/integration/facebook"
              element={<IntegrationFacebook />}
            />
            <Route path="/account" element={<Account />} />
            <Route path="/setting" element={<Setting />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
