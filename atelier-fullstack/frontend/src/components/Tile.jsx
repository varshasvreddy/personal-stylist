import { useApp } from '../AppContext'
import GarmentIcon from './GarmentIcon'

// A square product tile: the owner's photo when there is one, otherwise a drawing in the piece's colour.
export function Tile({ garment, className = '' }) {
  const { colors } = useApp()
  const hex = colors[garment.color]?.hex || '#8C919A'
  const style = { '--c': hex }
  if (garment.photo) style.backgroundImage = `url(${garment.photo})`
  return (
    <div className={`tile ${garment.photo ? 'photo' : ''} ${className}`} style={style}>
      <GarmentIcon category={garment.category} hex={hex} pattern={garment.pattern} />
    </div>
  )
}

export function Gear({ garment, onRemove, confirming, onConfirm }) {
  const { categories, meta } = useApp()
  const code = meta?.dress_codes.find((d) => d.value === garment.formality)?.label || ''
  return (
    <figure className="gi">
      <Tile garment={garment} />
      <figcaption>
        <b>{garment.name}</b>
        <span className="mono">{categories[garment.category]?.singular} · {code}</span>
        {onRemove && (
          <button type="button" className="rm" data-sure={confirming ? '1' : undefined} onClick={confirming ? onConfirm : onRemove}>
            {confirming ? 'Sure? Remove' : 'Remove'}
          </button>
        )}
      </figcaption>
    </figure>
  )
}
