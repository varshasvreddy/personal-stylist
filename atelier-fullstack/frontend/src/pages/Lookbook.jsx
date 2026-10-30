import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../AppContext'
import { api } from '../api'
import Band from '../components/Band'
import Stars from '../components/Stars'
import { Tile } from '../components/Tile'

function Review({ review }) {
  const C = 2 * Math.PI * 36
  return (
    <div className="review">
      <div className="ring">
        <svg viewBox="0 0 84 84"><circle className="bg" cx="42" cy="42" r="36" /><circle className="fg" cx="42" cy="42" r="36" strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - review.score / 10)).toFixed(1)} /></svg>
        <b>{review.score}</b><small>OF 10</small>
      </div>
      <div>
        <h5>{review.headline}</h5>
        {review.works?.length > 0 && <><span className="mono">What works</span><ul>{review.works.map((x) => <li key={x}>{x}</li>)}</ul></>}
        {review.tweaks?.length > 0 && <><span className="mono">Next time</span><ul className="tw">{review.tweaks.map((x) => <li key={x}>{x}</li>)}</ul></>}
        {review.hair && <><span className="mono">Hair</span><p>{review.hair}</p></>}
      </div>
    </div>
  )
}

function Post({ look, onChange }) {
  const { meta } = useApp()
  const [busy, setBusy] = useState('')
  const [status, setStatus] = useState({ text: '', err: false })
  const date = look.chosen_at ? new Date(look.chosen_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy('photo')
    setStatus({ text: 'Uploading…', err: false })
    const fd = new FormData()
    fd.append('photo', file)
    try {
      onChange(await api.postForm(`/looks/${look.id}/photo/`, fd))
      setStatus({ text: meta.ai_available ? 'Photo saved. Ask for your review below.' : 'Photo saved.', err: false })
    } catch (err) { setStatus({ text: err.message, err: true }) }
    finally { setBusy(''); e.target.value = '' }
  }
  async function review() {
    setBusy('review')
    setStatus({ text: 'Looking at your photo…', err: false })
    try { onChange(await api.post(`/looks/${look.id}/review/`)); setStatus({ text: '', err: false }) }
    catch (err) { setStatus({ text: err.message, err: true }) }
    finally { setBusy('') }
  }
  async function rate(n) {
    try { onChange(await api.patch(`/looks/${look.id}/`, { rating: n })) } catch { /* unchanged */ }
  }

  return (
    <article className="post">
      <div>
        <div className="polaroid">
          <div className="img" style={look.photo ? { backgroundImage: `url(${look.photo})` } : undefined}>{look.photo ? '' : 'Your photo goes here'}</div>
          <div className="cap">{look.title}</div>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mono eyebrow">{look.occasion_label}</p>
        <h4>{look.title}</h4>
        <p className="mono meta">{date}</p>
        <div className="mini">{look.items.map((g) => <Tile key={g.id} garment={g} />)}</div>
        <p className="note" style={{ marginBottom: 10 }}>{look.items.map((g) => g.name).join(', ')}</p>
        {look.hair && <div className="hairbox" style={{ marginBottom: 12 }}><span className="mono">Planned hair</span><p>{look.hair}</p></div>}
        <Stars value={look.rating} onChange={rate} />
        {look.review && <Review review={look.review} />}
        <div className="postbox">
          <div className="drop">
            <label className="lbl" htmlFor={`ph-${look.id}`}>{look.photo ? 'Replace the photo' : 'Post how you got ready'}</label>
            <input id={`ph-${look.id}`} type="file" accept="image/*" onChange={upload} disabled={!!busy} />
            {look.photo && meta.ai_available && !look.review && (
              <button type="button" className="btn primary sm" onClick={review} disabled={!!busy}>{busy === 'review' ? 'Reviewing…' : 'Get my review'}</button>
            )}
            {!meta.ai_available && <p className="note">Photo reviews need Claude, which is not set up on this server.</p>}
            <p className="note">Only you can see this photo. The review covers the outfit and styling, not you.</p>
            <p className={`status ${status.err ? 'err' : ''}`} role="status" aria-live="polite">{status.text}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Lookbook() {
  const [looks, setLooks] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get('/looks/?chosen=1').then(setLooks).catch((e) => setError(e.message)) }, [])
  const replace = (look) => setLooks((list) => list.map((l) => (l.id === look.id ? look : l)))

  return (
    <section>
      <Band title={<>The <em>lookbook</em></>}>The looks you picked. After the outing, post a photo and the stylist reviews how you wore it.</Band>
      <main className="wrap sec">
        {error && <p className="page-error">{error}</p>}
        <div className="posts">
          {looks?.map((l) => <Post key={l.id} look={l} onChange={replace} />)}
          {looks && looks.length === 0 && (
            <div className="empty">Nothing here yet. In <Link to="/style">Style me</Link>, tap “I am wearing this” on a look you like. It lands here, and after the outing you can post a photo for a review.</div>
          )}
        </div>
      </main>
    </section>
  )
}
