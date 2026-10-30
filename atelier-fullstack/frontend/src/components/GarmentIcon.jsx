// Flat garment drawings on a 100x100 canvas, filled with the piece's own colour.
const SHAPES = {
  top: { d: 'M31 16 L43 10 Q50 19 57 10 L69 16 L91 34 L81 47 L70 40 L70 90 L30 90 L30 40 L19 47 L9 34 Z', x: ['M43 10 Q50 19 57 10'] },
  bottom: { d: 'M29 8 H71 L76 92 H54 L50 36 L46 92 H24 Z', x: ['M29 16 H71'] },
  dress: { d: 'M40 6 L46 6 L50 17 L54 6 L60 6 L58 38 L76 94 H24 L42 38 Z', x: ['M42 38 H58'] },
  ethnic: { d: 'M33 8 Q50 24 67 8 L90 26 L81 43 L72 37 L72 94 L54 94 L50 74 L46 94 L28 94 L28 37 L19 43 L10 26 Z', x: ['M50 20 V74', 'M43 16 Q50 26 57 16'] },
  layer: { d: 'M33 8 L45 8 L50 30 L55 8 L67 8 L91 26 L85 80 L72 80 L72 92 L28 92 L28 80 L15 80 L9 26 Z', x: ['M50 30 L50 92', 'M45 8 L38 40 L50 30 L62 40 L55 8'] },
  shoes: { d: 'M6 64 Q6 50 20 47 L33 47 Q41 58 56 58 L79 58 Q94 60 94 72 L94 78 H6 Z', x: ['M6 72 H94', 'M34 47 L40 40', 'M44 52 L48 46'] },
}
const LINE = { stroke: 'rgba(43,16,21,.38)', strokeWidth: 1.3, strokeLinejoin: 'round', strokeLinecap: 'round' }

// Pattern fills (stripes, check...) are defined once for the whole page.
export function PatternDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="pt-stripes" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="3" height="9" fill="#fff" fillOpacity=".6" /></pattern>
        <pattern id="pt-check" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="5" height="12" fill="#fff" fillOpacity=".35" /><rect width="12" height="5" fill="#fff" fillOpacity=".35" /></pattern>
        <pattern id="pt-print" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.8" fill="#fff" fillOpacity=".7" /><circle cx="8" cy="8" r="1.4" fill="#000" fillOpacity=".3" /></pattern>
        <pattern id="pt-textured" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0" stroke="#fff" strokeOpacity=".3" strokeWidth="1" /><path d="M0 0 L6 6" stroke="#000" strokeOpacity=".12" strokeWidth="1" /></pattern>
      </defs>
    </svg>
  )
}

export default function GarmentIcon({ category, hex, pattern }) {
  const shape = SHAPES[category]
  let body
  if (shape) {
    body = (
      <>
        <path d={shape.d} fill={hex} {...LINE} />
        {pattern && pattern !== 'solid' && <path d={shape.d} fill={`url(#pt-${pattern})`} />}
        {shape.x.map((d) => <path key={d} d={d} fill="none" {...LINE} />)}
      </>
    )
  } else if (category === 'watch') {
    body = (
      <>
        <rect x="38" y="4" width="24" height="26" rx="5" fill={hex} {...LINE} />
        <rect x="38" y="70" width="24" height="26" rx="5" fill={hex} {...LINE} />
        <circle cx="50" cy="50" r="24" fill={hex} {...LINE} />
        <circle cx="50" cy="50" r="17" fill="none" {...LINE} />
        <path d="M50 50 V38 M50 50 L59 55" fill="none" {...LINE} />
      </>
    )
  } else if (category === 'jewellery') {
    body = (
      <>
        <path d="M18 18 Q50 98 82 18" fill="none" stroke={hex} strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="50" cy="72" r="8" fill={hex} {...LINE} />
      </>
    )
  } else if (category === 'bag') {
    body = (
      <>
        <path d="M36 40 Q36 12 50 12 Q64 12 64 40" fill="none" stroke={hex} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M16 38 H84 L90 92 H10 Z" fill={hex} {...LINE} />
        <path d="M16 50 H84" fill="none" {...LINE} />
      </>
    )
  } else {
    body = (
      <>
        <rect x="7" y="36" width="37" height="27" rx="12" fill={hex} {...LINE} />
        <rect x="56" y="36" width="37" height="27" rx="12" fill={hex} {...LINE} />
        <path d="M44 46 Q50 42 56 46 M7 42 L1 36 M93 42 L99 36" fill="none" {...LINE} />
      </>
    )
  }
  return <svg className="gm" viewBox="0 0 100 100" aria-hidden="true" focusable="false">{body}</svg>
}
