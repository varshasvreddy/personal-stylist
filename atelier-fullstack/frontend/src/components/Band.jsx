export default function Band({ title, children, action }) {
  return (
    <div className="band">
      <div className="wrap">
        <h2>{title}</h2>
        <p>{children}</p>
        {action && <div className="actions" style={{ marginTop: 16 }}>{action}</div>}
      </div>
    </div>
  )
}
