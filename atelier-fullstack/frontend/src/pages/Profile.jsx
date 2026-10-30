import { useEffect, useRef, useState } from 'react'
import { useApp } from '../AppContext'
import Band from '../components/Band'

export default function Profile() {
  const { meta, user, saveProfile } = useApp()
  const [p, setP] = useState(user)
  const [status, setStatus] = useState('')
  const timer = useRef(null)
  const dirty = useRef(false)

  // Save a moment after the last change.
  function change(patch) {
    const next = { ...p, ...patch }
    setP(next)
    dirty.current = true
    clearTimeout(timer.current)
    setStatus('')
    timer.current = setTimeout(async () => {
      try {
        const { email, ...body } = next
        await saveProfile(body)
        dirty.current = false
        setStatus('Saved.')
      } catch (e) { setStatus(e.message) }
    }, 600)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const toggle = (key, value) => change({ [key]: p[key].includes(value) ? p[key].filter((x) => x !== value) : [...p[key], value] })
  const exclusive = (key, value, clearable) => change({ [key]: p[key] === value && clearable ? '' : value })
  const chips = (key, list, multi, clearable = false) => (
    <div className="chips">
      {list.map((v) => (
        <button key={v} type="button" className="chip" aria-pressed={multi ? p[key].includes(v) : p[key] === v} onClick={() => (multi ? toggle(key, v) : exclusive(key, v, clearable))}>{v}</button>
      ))}
    </div>
  )
  const swatches = (key, avoid) => (
    <div className="swatches">
      {meta.colors.map((c) => (
        <button key={c.name} type="button" className={`cs ${avoid ? 'avoid' : ''}`} title={c.name} aria-label={c.name} aria-pressed={p[key].includes(c.name)} style={{ background: c.hex }}
          onClick={() => {
            const other = key === 'love' ? 'avoid' : 'love'
            const on = p[key].includes(c.name)
            change({ [key]: on ? p[key].filter((x) => x !== c.name) : [...p[key], c.name], ...(on ? {} : { [other]: p[other].filter((x) => x !== c.name) }) })
          }} />
      ))}
    </div>
  )

  return (
    <section>
      <Band title={<>About <em>you</em></>}>The more the stylist knows, the better the options. Changes save on their own.</Band>
      <main className="wrap sec" style={{ maxWidth: 700, display: 'grid', gap: 24 }}>
        <div className="brief" style={{ marginTop: 0, boxShadow: 'none' }}>
          <div className="field"><label htmlFor="pf-name">Name</label><input id="pf-name" type="text" maxLength={60} value={p.name} onChange={(e) => change({ name: e.target.value })} /></div>
          <div className="field"><label htmlFor="pf-email">Email</label><input id="pf-email" type="email" value={p.email} readOnly /></div>
          <fieldset><legend>Style</legend>{chips('styles', meta.styles, true)}</fieldset>
          <fieldset><legend>Fit</legend>{chips('fit', meta.fits, false, true)}</fieldset>
          <fieldset><legend>Hair length</legend>{chips('hair_length', meta.hair_lengths, false, true)}</fieldset>
          <fieldset><legend>Hair texture</legend>{chips('hair_texture', meta.hair_textures, false, true)}</fieldset>
          <fieldset><legend>Colours I love</legend>{swatches('love', false)}</fieldset>
          <fieldset><legend>Colours I avoid</legend>{swatches('avoid', true)}</fieldset>
          <fieldset><legend>Skin undertone</legend>{chips('undertone', meta.undertones, false, true)}</fieldset>
          <div className="field"><label htmlFor="pf-notes">Notes for your stylist</label>
            <textarea id="pf-notes" maxLength={400} value={p.notes} onChange={(e) => change({ notes: e.target.value })} placeholder="I run warm. No heels. I like sleeves rolled." /></div>
          <p className="status" role="status" aria-live="polite">{status}</p>
        </div>
      </main>
    </section>
  )
}
