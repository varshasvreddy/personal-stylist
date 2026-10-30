import { useEffect, useRef, useState } from 'react'
import { useApp } from '../AppContext'
import { api } from '../api'

export default function AddPiece({ category, onClose }) {
  const { meta, categories, addGarment } = useApp()
  const first = useRef(null)
  const blank = (cat) => ({ name: '', category: cat, color: 'navy', pattern: 'solid', formality: categories[cat]?.default_formality ?? 2, warmth: 2 })
  const [f, setF] = useState(blank(category))
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const [status, setStatus] = useState({ text: '', err: false })

  useEffect(() => { first.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const pick = (e) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
    setStatus({ text: '', err: false })
  }

  async function readPhoto() {
    setReading(true)
    setStatus({ text: 'Looking at the photo…', err: false })
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const r = await api.postForm('/garments/analyze/', fd)
      setF((s) => ({ ...s, ...r, name: r.name || s.name }))
      setStatus({ text: 'Filled in. Check the details, then add it.', err: false })
    } catch (err) {
      setStatus({ text: err.message, err: true })
    } finally {
      setReading(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData()
    Object.entries(f).forEach(([k, v]) => fd.append(k, v))
    if (file) fd.append('photo', file)
    try {
      const g = await addGarment(fd)
      setStatus({ text: `${g.name} added. Add another or press Done.`, err: false })
      setF(blank(f.category))
      setFile(null)
      setPreview('')
      first.current?.focus()
    } catch (err) {
      setStatus({ text: err.message, err: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet-in" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
        <div className="sheet-head"><h3 id="sheetTitle">Add a piece</h3><button type="button" className="btn sm line" onClick={onClose}>Close</button></div>
        <div className="photo-row">
          <div className="thumb" role="img" aria-label="Photo preview" style={preview ? { backgroundImage: `url(${preview})` } : undefined} />
          <div className="col">
            <label className="lbl" htmlFor="photo">Photo (optional)</label>
            <input id="photo" type="file" accept="image/*" onChange={pick} />
            {file && meta.ai_available && <button type="button" className="btn sm line" onClick={readPhoto} disabled={reading}>{reading ? 'Reading…' : 'Fill in from photo'}</button>}
          </div>
        </div>
        <div className="field"><label htmlFor="f-name">Name</label>
          <input id="f-name" ref={first} type="text" maxLength={60} required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Navy linen shirt" /></div>
        <div className="field"><label htmlFor="f-cat">Shelf</label>
          <select id="f-cat" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value, formality: categories[e.target.value].default_formality })}>
            {meta.categories.map((c) => <option key={c.key} value={c.key}>{c.plural}</option>)}
          </select></div>
        <fieldset><legend>Colour</legend>
          <div className="swatches">
            {meta.colors.map((c) => (
              <button key={c.name} type="button" className="cs" title={c.name} aria-label={c.name} aria-pressed={f.color === c.name} style={{ background: c.hex }} onClick={() => set('color', c.name)} />
            ))}
          </div></fieldset>
        <div className="field"><label htmlFor="f-pat">Pattern</label>
          <select id="f-pat" value={f.pattern} onChange={(e) => set('pattern', e.target.value)}>
            {meta.patterns.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select></div>
        <div className="field"><label htmlFor="f-formal">Dress code</label>
          <select id="f-formal" value={f.formality} onChange={(e) => set('formality', +e.target.value)}>
            {meta.dress_codes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select></div>
        <div className="field"><label htmlFor="f-warm">Weight</label>
          <select id="f-warm" value={f.warmth} onChange={(e) => set('warmth', +e.target.value)}>
            {meta.weights.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select></div>
        <div className="actions">
          <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Adding…' : 'Add to closet'}</button>
          <button type="button" className="btn line" onClick={onClose}>Done</button>
        </div>
        <p className={`status ${status.err ? 'err' : ''}`} role="status" aria-live="polite">{status.text}</p>
      </form>
    </div>
  )
}
