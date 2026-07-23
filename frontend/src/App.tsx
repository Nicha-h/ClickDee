import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Home from '@/pages/home'

const App = () => {
  return (
    <div className="w-full min-h-screen bg-gray-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  )
}

export default App
