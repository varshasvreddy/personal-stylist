import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../AppContext'

export default function Layout() {
  const { user, logout } = useApp()
  const initials = (user.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="word">Atelier Me</div>
          <nav aria-label="Sections">
            <NavLink to="/closet">Closet</NavLink>
            <NavLink to="/style">Style me</NavLink>
            <NavLink to="/lookbook">Lookbook</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </nav>
          <div className="me">
            <span className="mono">{user.name}</span>
            <span className="av" aria-hidden="true">{initials}</span>
            <button className="btn signout" type="button" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  )
}
