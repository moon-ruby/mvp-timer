import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { mapThumbUrl } from '../lib/monsters'
import { formatAgo, formatClock, formatDuration, getTimerStatus } from '../lib/time'
import { Badge, Sprite } from './common'

const LABELS = {
  counting_down: 'Spawn in',
  spawn_window: 'Spawn possible',
  spawned: 'Spawned',
  idle: 'Stopped',
  untimed: 'No timer',
}

export default function TimerCard({ timer, now, settings, isFavorite, actions }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: timer.id })
  const status = getTimerStatus(timer, now)
  const { state, monster, spawn } = status
  if (!monster) return null
  const utc = settings.timeZone !== 'local'

  let clock = '--:--'
  if (state === 'counting_down' || state === 'spawn_window') clock = formatDuration(status.remaining)
  if (state === 'spawned') clock = settings.goNegative ? formatDuration(status.remaining) : 'UP'

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`timer-card timer-card--${state}${isDragging ? ' timer-card--dragging' : ''}`}
    >
      <div className="timer-card-top">
        <button className="drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
          ⋮⋮
        </button>
        <Sprite monster={monster} size={44} />
        <div className="timer-card-title">
          <strong>{monster.name}</strong>
          <span className="muted">
            {timer.map}
            {spawn?.special && ` · ${spawn.special}`}
          </span>
        </div>
        <Badge monster={monster} />
      </div>

      <div className="timer-card-body">
        <div>
          <div className="timer-state">{state === 'spawn_window' ? 'Spawn possible · window ends in' : LABELS[state]}</div>
          <div className="timer-clock">{clock}</div>
          {timer.killedAt != null && spawn?.respawnMin != null && (
            <div className="muted small">
              Killed {formatClock(timer.killedAt, utc)}{utc ? ' UTC' : ''} ({formatAgo(now - timer.killedAt)}) · window{' '}
              {formatClock(status.minAt, utc)}–{formatClock(status.maxAt, utc)}
            </div>
          )}
        </div>
        <button className="map-thumb" onClick={actions.marker} aria-label="Set tomb marker on map">
          <img src={mapThumbUrl(timer.map)} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          {timer.marker && <span className="map-marker" style={{ left: `${timer.marker.x}%`, top: `${timer.marker.y}%` }} />}
        </button>
      </div>

      {spawn?.respawnMin != null && (
        <div className="progress">
          <div style={{ width: `${(status.progress ?? 0) * 100}%` }} />
        </div>
      )}
      {timer.note && <p className="timer-note">📝 {timer.note}</p>}

      <div className="timer-card-actions">
        <button className="btn btn--primary btn--sm" onClick={actions.restart} disabled={state === 'untimed'}>
          Restart timer
        </button>
        <button className="btn btn--sm" onClick={actions.edit}>
          Edit
        </button>
        {timer.killedAt != null && (
          <button className="btn btn--sm" onClick={actions.stop}>
            Stop
          </button>
        )}
        <span className="spacer" />
        <button className={`icon-btn${isFavorite ? ' icon-btn--on' : ''}`} onClick={actions.favorite} aria-label={isFavorite ? 'Remove from favorites' : 'Add to Favorites'}>
          {isFavorite ? '★' : '☆'}
        </button>
        <button className="icon-btn" onClick={actions.info} aria-label="More info">
          ⓘ
        </button>
        <button className="icon-btn icon-btn--danger" onClick={actions.remove} aria-label="Remove">
          🗑
        </button>
      </div>
    </article>
  )
}
