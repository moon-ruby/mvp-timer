import { MONSTERS_BY_ID, findSpawn, isTimed } from './monsters'

const MIN = 60_000

// States: idle (stopped / no kill time), untimed (instance spawn), counting_down,
// spawn_window (between min and max respawn), spawned (past max).
export function getTimerStatus(timer, now) {
  const monster = MONSTERS_BY_ID.get(timer.monsterId)
  const spawn = findSpawn(monster, timer.map)
  if (!isTimed(spawn)) return { state: 'untimed', monster, spawn }
  if (timer.killedAt == null) return { state: 'idle', monster, spawn }

  const minAt = timer.killedAt + spawn.respawnMin * MIN
  const maxAt = timer.killedAt + spawn.respawnMax * MIN
  const total = maxAt - timer.killedAt || 1
  const progress = Math.min(1, Math.max(0, (now - timer.killedAt) / total))

  if (now < minAt) return { state: 'counting_down', monster, spawn, minAt, maxAt, remaining: minAt - now, progress }
  if (now < maxAt) return { state: 'spawn_window', monster, spawn, minAt, maxAt, remaining: maxAt - now, progress }
  return { state: 'spawned', monster, spawn, minAt, maxAt, remaining: maxAt - now, progress: 1 }
}

export function formatDuration(ms) {
  const neg = ms < 0
  const s = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${neg ? '-' : ''}${h ? `${h}:${pad(m)}` : m}:${pad(sec)}`
}

export function formatClock(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// "HH:MM" today; if that is in the future it must have been yesterday.
export function clockToTimestamp(hhmm, now = Date.now()) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  if (d.getTime() > now) d.setDate(d.getDate() - 1)
  return d.getTime()
}

export function toClockInput(ms) {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
