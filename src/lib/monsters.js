import data from '../data/monsters.json'

// Respawn data (minutes) taken from the SovereignRO MVP Tracker.
// Images are loaded from Divine Pride's public database.
export const MONSTERS = data
export const MONSTERS_BY_ID = new Map(data.map((m) => [m.id, m]))

export const spriteUrl = (id) => `https://static.divine-pride.net/images/mobs/png/${id}.png`
export const mapThumbUrl = (map) => `https://www.divine-pride.net/img/map/original/${encodeURIComponent(map)}`
export const mapRawUrl = (map) => `https://www.divine-pride.net/img/map/raw/${encodeURIComponent(map)}`

export const isTimed = (spawn) => spawn?.respawnMin != null && spawn?.respawnMax != null

export function findSpawn(monster, map) {
  return monster?.spawns.find((s) => s.map === map) ?? null
}

export function defaultSpawn(monster) {
  return monster?.spawns.find(isTimed) ?? monster?.spawns[0] ?? null
}

export function searchMonsters(query, category = 'all') {
  const q = query.trim().toLowerCase()
  return MONSTERS.filter(
    (m) =>
      (category === 'all' || m.category === category) &&
      (!q || m.name.toLowerCase().includes(q) || m.spawns.some((s) => s.map.toLowerCase().includes(q))),
  )
}

export function formatRespawn(spawn) {
  if (!isTimed(spawn)) return spawn?.special || 'Instance'
  const f = (m) => (m % 60 === 0 ? `${m / 60}h` : m > 60 ? `${Math.floor(m / 60)}h${m % 60}m` : `${m}m`)
  return spawn.respawnMin === spawn.respawnMax ? f(spawn.respawnMin) : `${f(spawn.respawnMin)}–${f(spawn.respawnMax)}`
}
