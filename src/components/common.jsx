import { useEffect, useState } from 'react'
import { spriteUrl } from '../lib/monsters'

export function Sprite({ monster, size = 48 }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className="sprite sprite--fallback" style={{ width: size, height: size }}>
        {monster.name[0]}
      </span>
    )
  }
  return (
    <img
      className="sprite"
      src={spriteUrl(monster.id)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function Badge({ monster }) {
  return monster.category === 'miniboss' ? <span className="badge badge--mini">Mini-boss</span> : <span className="badge">MVP</span>
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

// Two-step button instead of window.confirm, which blocks the page.
export function ConfirmButton({ children, confirmLabel = 'Click again to confirm', onConfirm, className = '' }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])
  return (
    <button
      className={`${className}${armed ? ' btn--confirming' : ''}`}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
