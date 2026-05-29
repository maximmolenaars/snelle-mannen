import { NavLink, Route, Routes } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard'
import Athletes from './pages/Athletes'
import AthleteDetail from './pages/AthleteDetail'
import Deltas from './pages/Deltas'

function Nav() {
  const link = ({ isActive }: { isActive: boolean }) =>
    'nav-link' + (isActive ? ' active' : '')
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <img src="/bolt.svg" className="bolt" alt="" />
          Snelle&nbsp;Mannen
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end className={link}>
            Records
          </NavLink>
          <NavLink to="/athletes" className={link}>
            Athletes
          </NavLink>
          <NavLink to="/head2head" className={link}>
            Head 2 Head
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>SNELLE MANNEN · TRACK CLUB</span>
        <span className="mono">EST. 2024 — KEEP RUNNING</span>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="shell">
      <Nav />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/athletes" element={<Athletes />} />
          <Route path="/athletes/:id" element={<AthleteDetail />} />
          <Route path="/head2head" element={<Deltas />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
