import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Home from '@/pages/home'
import Topbar from '@/components/Topbar'

const App = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
