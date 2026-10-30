import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../AppContext'
import { api } from '../api'
import Band from '../components/Band'
import LookCard from '../components/LookCard'

export default function Style() {
  const { meta, garments, closetReady, styleSession, setStyleSession } = useApp()
  const saved = styleSession || {}
  const [occasion, setOccasion] = useState(saved.occasion || 'cafe')
  const [temperature, setTemperature] = useState(saved.temperature ?? 26)
  const [rain, setRain] = useState(saved.rain || false)
  const [details, setDetails] = useState(saved.details || '')
  const [adjust, setAdjust] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ text: '', err: false })
  const ctl = useRef(null)
  const looks = saved.looks || []

  const word = temperature < 10 ? 'Cold' : temperature < 18 ? 'Cool' : temperature < 25 ? 'Mild' : temperature < 32 ? 'Warm' : 'Hot'

  async function run(mode, adjustText = '') {
    setBusy(true)
    setMessage({ text: mode === 'rules' ? '' : 'The stylist is working through your closet…', err: false })
    ctl.current = new AbortController()
    try {
      const r = await api.post('/styling/suggest/', {
        occasion, temperature, rain, details, mode, adjust: adjustText, previous: adjustText ? looks.map((l) => l.id) : [],
      }, { signal: ctl.current.signal })
      setStyleSession({ occasion, temperature, rain, details, looks: r.looks, source: r.source })
      setMessage({ text: r.notice || '', err: !!r.notice })
      setAdjust('')
    } catch (e) {
      setMessage(e.name === 'AbortError' ? { text: 'Stopped.', err: false } : { text: e.message, err: true })
    } finally {
      setBusy(false)
    }
  }

  const update = (look) => setStyleSession({ ...saved, occasion, temperature, rain, details, looks: looks.map((l) => (l.id === look.id ? look : l)) })

  return (
    <section>
      <Band title={<>Where are <em>you</em> headed?</>}>Pick the occasion and the weather. You get four looks from your own closet, with a hair idea for each.</Band>
      <main className="wrap">
        <form className="brief" onSubmit={(e) => { e.preventDefault(); run('auto') }}>
          <fieldset><legend>Occasion</legend>
            <div className="chips">
              {meta.occasions.map((o) => <button key={o.key} type="button" className="chip" aria-pressed={occasion === o.key} onClick={() => setOccasion(o.key)}>{o.label}</button>)}
            </div></fieldset>
          <div className="brief-grid">
            <div className="field">
              <label htmlFor="temp"><span>Temperature</span><output htmlFor="temp">{temperature}°C · {word}</output></label>
              <input id="temp" type="range" min="4" max="42" value={temperature} onChange={(e) => setTemperature(+e.target.value)} />
              <div className="scale"><span>4°C</span><span>42°C</span></div>
            </div>
            <div className="field">
              <label htmlFor="details"><span>Tell me more</span></label>
              <input id="details" type="text" maxLength={160} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Picnic by the lake, sitting on the grass" />
              <label className="check" htmlFor="rain" style={{ marginTop: 6 }}><input id="rain" type="checkbox" checked={rain} onChange={(e) => setRain(e.target.checked)} /> Rain expected</label>
            </div>
          </div>
          <div className="actions">
            <button type="submit" className="btn primary" disabled={busy}>Style me</button>
            {busy && <button type="button" className="btn" onClick={() => ctl.current?.abort()}>Stop</button>}
            <button type="button" className="btn line" disabled={busy} onClick={() => run('rules')} title="Instant looks from the built-in colour and dress-code rules">Quick mix</button>
          </div>
          <p className={`status ${message.err ? 'err' : ''}`} role="status" aria-live="polite">{message.text}</p>
        </form>

        <div className="res-head"><h3>Your options</h3><span className="mono">{looks.length ? (saved.source === 'claude' ? 'Styled by Claude' : 'Quick mix · built-in rules') : ''}</span></div>
        {looks.map((l) => <LookCard key={l.id} look={l} onChange={update} />)}
        {looks.length === 0 && closetReady && (
          <div className="empty">
            {garments.length === 0
              ? <>Your closet is empty. <Link to="/closet">Add a few pieces</Link> and the stylist will build looks from them.</>
              : <>Press <b>Style me</b> for looks from your closet. You need a top and a bottom, or a dress or an ethnic set.</>}
          </div>
        )}
        {looks.length > 0 && meta.ai_available && (
          <form className="refine" onSubmit={(e) => { e.preventDefault(); adjust.trim() && run('auto', adjust.trim()) }}>
            <label className="lbl" htmlFor="adjust">Not quite right? Tell the stylist</label>
            <div className="row">
              <input id="adjust" type="text" maxLength={200} value={adjust} onChange={(e) => setAdjust(e.target.value)} placeholder="Swap the shoes, make it dressier, no jacket" />
              <button className="btn" type="submit" disabled={busy}>Adjust</button>
            </div>
          </form>
        )}
      </main>
    </section>
  )
}
