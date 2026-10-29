import { useState } from 'react'
import { MONSTERS_BY_ID, defaultSpawn, formatRespawn, isTimed } from '../lib/monsters'
import { clockToTimestamp, toClockInput } from '../lib/time'
import { Badge, Modal, Sprite } from './common'

// Used both to add a timer (timer = null) and to edit one.
export default function TimerDialog({ monsterId, timer, utc = true, onSave, onClose }) {
  const monster = MONSTERS_BY_ID.get(timer?.monsterId ?? monsterId)
  const [map, setMap] = useState(timer?.map ?? defaultSpawn(monster)?.map ?? '')
  const [mode, setMode] = useState(timer?.killedAt != null ? 'clock' : 'now')
  const [hoursAgo, setHoursAgo] = useState('')
  const [minutesAgo, setMinutesAgo] = useState('')
  const [clock, setClock] = useState(toClockInput(timer?.killedAt ?? Date.now(), utc))
  const [note, setNote] = useState(timer?.note ?? '')

  if (!monster) return null

  const submit = (e) => {
    e.preventDefault()
    const now = Date.now()
    let killedAt = now
    if (mode === 'ago') {
      const minutes = (Math.max(0, Number(hoursAgo) || 0) * 60 + Math.max(0, Number(minutesAgo) || 0))
      killedAt = now - minutes * 60_000
    }
    if (mode === 'clock') killedAt = clock ? clockToTimestamp(clock, now, utc) : now
    if (mode === 'none') killedAt = null
    // Moving to another map invalidates the tomb marker position.
    const marker = timer && timer.map === map ? timer.marker : null
    onSave({ monsterId: monster.id, map, killedAt, note: note.trim(), marker })
  }

  return (
    <Modal title={timer ? 'Edit timer' : 'Add to Active Hunt'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="dialog-monster">
          <Sprite monster={monster} size={56} />
          <div>
            <strong>{monster.name}</strong> <Badge monster={monster} />
            {monster.specialCondition && <p className="muted small pre">{monster.specialCondition}</p>}
          </div>
        </div>

        <label className="field">
          <span>{timer ? 'Change map' : 'Choose last kill map'}</span>
          <select className="input" value={map} onChange={(e) => setMap(e.target.value)}>
            {monster.spawns.map((s) => (
              <option key={s.map} value={s.map}>
                {s.map} — {formatRespawn(s)}
                {!isTimed(s) ? ' (no timer)' : ''}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="field">
          <span>Last kill</span>
          <div className="segmented">
            {[
              ['now', 'Just now'],
              ['ago', 'Time ago'],
              ['clock', utc ? 'At server time' : 'At time'],
              ['none', 'Unknown'],
            ].map(([value, label]) => (
              <label key={value} className={mode === value ? 'active' : ''}>
                <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} />
                {label}
              </label>
            ))}
          </div>
          {mode === 'ago' && (
            <div className="ago-inputs">
              <input
                className="input"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={hoursAgo}
                onChange={(e) => setHoursAgo(e.target.value)}
                aria-label="Hours ago"
                autoFocus
              />
              <span>h</span>
              <input
                className="input"
                type="number"
                min="0"
                max="59"
                inputMode="numeric"
                placeholder="e.g. 47"
                value={minutesAgo}
                onChange={(e) => setMinutesAgo(e.target.value)}
                aria-label="Minutes ago"
              />
              <span>m ago</span>
            </div>
          )}
          {mode === 'clock' && <input className="input" type="time" value={clock} onChange={(e) => setClock(e.target.value)} />}
          {mode === 'clock' && (
            <span className="muted small">
              Time from the MVP tomb{utc ? ' (server time, UTC)' : ''}. If it's later than now, yesterday is assumed.
            </span>
          )}
        </fieldset>

        <label className="field">
          <span>Note</span>
          <textarea className="input" rows={2} placeholder="Write a note about this MVP…" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn btn--primary">
            {timer ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
