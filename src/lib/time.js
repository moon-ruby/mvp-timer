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

// Clock times follow the server (UTC) by default, matching the time shown on MVP tombs.
export function formatClock(ms, utc = true, seconds = false) {
  return new Date(ms).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
    ...(utc ? { timeZone: 'UTC' } : {}),
  })
}

export function formatAgo(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d) return `${d}d ${h}h ago`
  if (h) return `${h}h ${m}m ago`
  return `${m}m ago`
}

// "HH:MM" today; if that is in the future it must have been yesterday.
export function clockToTimestamp(hhmm, now = Date.now(), utc = true) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(now)
  if (utc) d.setUTCHours(h, m, 0, 0)
  else d.setHours(h, m, 0, 0)
  if (d.getTime() > now) d.setTime(d.getTime() - 86_400_000)
  return d.getTime()
}

export function toClockInput(ms, utc = true) {
  const d = new Date(ms)
  const h = utc ? d.getUTCHours() : d.getHours()
  const m = utc ? d.getUTCMinutes() : d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
