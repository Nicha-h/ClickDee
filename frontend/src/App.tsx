import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Home from '@/pages/home'
import Campaign from '@/pages/campaign'
import CampaignReport from '@/pages/campaignReport'
import Ai from '@/pages/ai'
import Overview from '@/pages/overview'
import Topbar from '@/components/Topbar'

const App = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaign" element={<Campaign />} />
          <Route
            path="/campaign/:campaignId/report"
            element={<CampaignReport />}
          />
          <Route path="/ai" element={<Ai />} />
          <Route path="/overview" element={<Overview />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
