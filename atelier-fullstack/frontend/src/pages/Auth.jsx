import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { Tile } from '../components/Tile'

const COLLAGE = [
  { category: 'top', color: 'rust', pattern: 'stripes' },
  { category: 'layer', color: 'navy', pattern: 'solid' },
  { category: 'ethnic', color: 'mustard', pattern: 'solid' },
  { category: 'dress', color: 'forest', pattern: 'solid' },
  { category: 'shoes', color: 'white', pattern: 'solid' },
]

export default function Auth() {
  const { login, register, meta } = useApp()
  const nav = useNavigate()
  const [mode, setMode] = useState('register')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'register') await register(f.name, f.email, f.password)
      else await login(f.email, f.password)
      nav('/closet', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="land">
      <div className="land-hero">
        <div className="word">Atelier Me</div>
        <div>
          <h1>Your closet, <em>styled.</em></h1>
          <p className="lede">Upload what you already own. Say where you are going. Get outfits made only from your own wardrobe, hair included. Wear one, post a photo, get an honest review.</p>
        </div>
        <div className="collage" aria-hidden="true">
          {meta && COLLAGE.map((g) => <Tile key={g.category} garment={g} />)}
        </div>
      </div>
      <div className="land-form">
        <form onSubmit={submit}>
          <h2>{mode === 'register' ? 'Create your closet' : 'Welcome back'}</h2>
          <div className="seg" role="group" aria-label="Account">
            <button type="button" aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setError('') }}>Sign up</button>
            <button type="button" aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError('') }}>Log in</button>
          </div>
          {mode === 'register' && (
            <div className="field"><label htmlFor="name">Your name</label>
              <input id="name" type="text" autoComplete="name" maxLength={60} required value={f.name} onChange={set('name')} /></div>
          )}
          <div className="field"><label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" maxLength={120} required value={f.email} onChange={set('email')} placeholder="you@example.com" /></div>
          <div className="field"><label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 8 : undefined} value={f.password} onChange={set('password')} />
            {mode === 'register' && <span className="pw-hint">At least 8 characters, and not a common password.</span>}
          </div>
          <button className="btn primary" type="submit" disabled={busy}>{busy ? 'One moment…' : mode === 'register' ? 'Create account' : 'Log in'}</button>
          <p className={`status ${error ? 'err' : ''}`} role="status" aria-live="polite">{error}</p>
          <p className="why">Your closet, photos and ratings are private to your account.</p>
        </form>
      </div>
    </section>
  )
}
