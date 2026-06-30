import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ChampionPage from './pages/Champion'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/champion/:id" element={<ChampionPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
