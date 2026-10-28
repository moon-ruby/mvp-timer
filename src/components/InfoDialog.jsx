import { MONSTERS_BY_ID, formatRespawn } from '../lib/monsters'
import { Badge, Modal, Sprite } from './common'

export default function InfoDialog({ monsterId, onClose }) {
  const monster = MONSTERS_BY_ID.get(monsterId)
  if (!monster) return null
  return (
    <Modal title="More info" onClose={onClose}>
      <div className="dialog-monster">
        <Sprite monster={monster} size={72} />
        <div>
          <strong>{monster.name}</strong> <Badge monster={monster} />
          <div className="muted small">ID {monster.id}</div>
        </div>
      </div>
      {monster.specialCondition && <p className="pre">{monster.specialCondition}</p>}
      <table className="spawn-table">
        <thead>
          <tr>
            <th>Map</th>
            <th>Type</th>
            <th>Respawn</th>
          </tr>
        </thead>
        <tbody>
          {monster.spawns.map((s) => (
            <tr key={s.map}>
              <td>{s.map}</td>
              <td>{s.mapType === 'instance' ? 'Instance' : 'Field'}</td>
              <td>{formatRespawn(s)}</td>
            </tr>
          ))}
          {monster.spawns.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                No known spawn.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="dialog-actions">
        <a className="btn" href={monster.divinePrideUrl} target="_blank" rel="noreferrer">
          Divine Pride ↗
        </a>
        <button className="btn btn--primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
