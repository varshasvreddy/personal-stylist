export default function Stars({ value, onChange, label = 'Rate it' }) {
  return (
    <div className="stars" role="group" aria-label="Rate this look">
      <span className="mono">{label}</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="star" aria-label={`Rate ${n} out of 5`} aria-pressed={value >= n} onClick={() => onChange(n)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.4 6.1 20.8l1.3-6.7L2.5 9.5l6.6-.8z" /></svg>
        </button>
      ))}
    </div>
  )
}
