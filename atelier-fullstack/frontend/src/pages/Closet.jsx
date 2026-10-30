import { useState } from 'react'
import { useApp } from '../AppContext'
import { api } from '../api'
import AddPiece from '../components/AddPiece'
import Band from '../components/Band'
import { Gear } from '../components/Tile'

export default function Closet() {
  const { meta, garments, closetReady, removeGarment } = useApp()
  const [adding, setAdding] = useState(null) // the shelf the dialog opens on
  const [sure, setSure] = useState(null)
  const [gaps, setGaps] = useState(null)
  const [gapState, setGapState] = useState({ busy: false, error: '' })

  async function remove(id) {
    setSure(null)
    try { await removeGarment(id) } catch (e) { setGapState({ busy: false, error: e.message }) }
  }
  async function loadGaps() {
    setGapState({ busy: true, error: '' })
    try { setGaps(await api.get('/styling/gaps/')); setGapState({ busy: false, error: '' }) }
    catch (e) { setGapState({ busy: false, error: e.message }) }
  }

  return (
    <section onClick={() => sure && setSure(null)}>
      <Band title={<>Your <em>closet</em></>} action={<button className="btn primary" type="button" onClick={() => setAdding('top')}>Add a piece</button>}>
        Every piece you own, shelved by type. Add them once and the stylist only ever works from what is here.
      </Band>
      <main className="wrap">
        {closetReady && garments.length === 0 && (
          <div className="banner" style={{ marginTop: 20 }}>
            <span><b>Your closet is empty.</b> Start with the pieces you wear most. A photo is optional.</span>
            <button className="btn sm primary" type="button" onClick={() => setAdding('top')}>Add my first piece</button>
          </div>
        )}
        {meta.categories.map((c) => {
          const items = garments.filter((g) => g.category === c.key)
          return (
            <section className="rail" key={c.key} aria-label={c.plural}>
              <header><span className="ct">{String(items.length).padStart(2, '0')}</span><h3>{c.plural}</h3></header>
              <div className="track">
                {items.map((g) => (
                  <Gear key={g.id} garment={g} confirming={sure === g.id}
                    onRemove={(e) => { e?.stopPropagation(); setSure(g.id) }} onConfirm={() => remove(g.id)} />
                ))}
                <button type="button" className="addtile" aria-label={`Add to ${c.plural}`} onClick={() => setAdding(c.key)}>+<span>Add</span></button>
              </div>
            </section>
          )
        })}
        <div className="actions" style={{ marginTop: 22 }}>
          <button className="btn" type="button" onClick={loadGaps} disabled={gapState.busy || garments.length === 0}>{gapState.busy ? 'Thinking…' : 'What is my closet missing?'}</button>
        </div>
        <p className={`status ${gapState.error ? 'err' : ''}`} role="status" aria-live="polite">{gapState.error}</p>
        {gaps && (
          <div className="gaplist">
            {gaps.gaps.length === 0 && <div className="banner">Nothing obvious is missing. Add more pieces and ask again.</div>}
            {gaps.gaps.map((g) => (
              <div className="banner" style={{ display: 'block' }} key={g.piece}><b>{g.piece}</b><p>{g.why}</p><p className="note">{g.unlocks}</p></div>
            ))}
          </div>
        )}
      </main>
      {adding && <AddPiece category={adding} onClose={() => setAdding(null)} />}
    </section>
  )
}
