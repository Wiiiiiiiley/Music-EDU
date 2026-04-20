import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './stores/appStore'
import LandingPage from './pages/LandingPage'
import RoleSelectPage from './pages/RoleSelectPage'
import ConductorPage from './pages/ConductorPage'
import PlayerPage from './pages/PlayerPage'
import EnsembleSetupPage from './pages/EnsembleSetupPage'
import ScoreUploadPage from './pages/ScoreUploadPage'

function App() {
  const { currentUser } = useAppStore()

  return (
    <div className="h-full w-full bg-gray-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/role-select" element={<RoleSelectPage />} />
        <Route path="/setup" element={<EnsembleSetupPage />} />
        <Route path="/upload" element={<ScoreUploadPage />} />
        <Route 
          path="/conductor/*" 
          element={currentUser?.role === 'CONDUCTOR' ? <ConductorPage /> : <Navigate to="/role-select" />} 
        />
        <Route 
          path="/player/*" 
          element={currentUser?.role === 'PLAYER' ? <PlayerPage /> : <Navigate to="/role-select" />} 
        />
      </Routes>
    </div>
  )
}

export default App
