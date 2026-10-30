import { Link } from 'react-router-dom'
import { api } from '../api'
import { Gear } from './Tile'
import Stars from './Stars'

// One suggested outfit. Rating and "I am wearing this" are saved to the server straight away.
export default function LookCard({ look, onChange }) {
  async function patch(body) {
    try { onChange(await api.patch(`/looks/${look.id}/`, body)) } catch { /* the card keeps its previous state */ }
  }
  return (
    <article className="look">
      <div className="look-grid">
        <div>
          <p className="mono eyebrow">{look.occasion_label}</p>
          <h4>{look.title}</h4>
          <div className="pieces" style={{ marginTop: 14 }}>
            {look.items.map((g) => <Gear key={g.id} garment={g} />)}
          </div>
        </div>
        <div className="copy">
          <div className="hairbox"><span className="mono">Hair</span><p>{look.hair}</p></div>
          {look.why && <p>{look.why}</p>}
          {look.tip && <p className="tip">{look.tip}</p>}
          {look.missing.length > 0 && (
            <p className="gapnote">
              <span className="mono">To finish this look</span>
              Add {look.missing.map((m, i) => <span key={m}>{i > 0 && ', '}<b>{m}</b></span>)} in your <Link to="/closet">Closet</Link>.
            </p>
          )}
        </div>
      </div>
      <div className="look-foot">
        <Stars value={look.rating} onChange={(n) => patch({ rating: n })} />
        {look.chosen
          ? <Link className="btn line" to="/lookbook">Picked. See it in the Lookbook</Link>
          : <button type="button" className="btn primary" onClick={() => patch({ chosen: true })}>I am wearing this</button>}
      </div>
    </article>
  )
}
