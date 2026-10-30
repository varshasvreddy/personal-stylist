import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useApp } from './AppContext'
import { PatternDefs } from './components/GarmentIcon'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Closet from './pages/Closet'
import Lookbook from './pages/Lookbook'
import Profile from './pages/Profile'
import Style from './pages/Style'

function Gate() {
  const { user, booting, meta, metaError } = useApp()
  if (metaError) return <div className="wrap"><p className="page-error">{metaError}</p></div>
  if (booting || !meta) return <div className="booting"><div className="word">Atelier Me</div></div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useApp()
  return (
    <>
      <PatternDefs />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/closet" replace /> : <Auth />} />
        <Route element={<Gate />}>
          <Route element={<Layout />}>
            <Route path="/closet" element={<Closet />} />
            <Route path="/style" element={<Style />} />
            <Route path="/lookbook" element={<Lookbook />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/closet" replace />} />
      </Routes>
    </>
  )
}
