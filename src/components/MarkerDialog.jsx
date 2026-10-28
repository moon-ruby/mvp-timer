import { useState } from 'react'
import { MONSTERS_BY_ID, mapRawUrl } from '../lib/monsters'
import { Modal } from './common'

export default function MarkerDialog({ timer, onSave, onClose }) {
  const [failed, setFailed] = useState(false)
  const monster = MONSTERS_BY_ID.get(timer.monsterId)

  const place = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10
    onSave({ x, y })
  }

  return (
    <Modal title={`${monster?.name ?? ''} · ${timer.map}`} onClose={onClose} wide>
      <p className="muted small">Click the map to place or move the marker · Esc to close</p>
      {failed ? (
        <p className="muted">No map image available for this spawn.</p>
      ) : (
        <div className="marker-map" onClick={place}>
          <img src={mapRawUrl(timer.map)} alt={timer.map} onError={() => setFailed(true)} draggable={false} />
          {timer.marker && <span className="map-marker map-marker--big" style={{ left: `${timer.marker.x}%`, top: `${timer.marker.y}%` }} />}
        </div>
      )}
      <div className="dialog-actions">
        {timer.marker && (
          <button className="btn" onClick={() => onSave(null)}>
            Remove marker
          </button>
        )}
        <button className="btn btn--primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
