import { MONSTERS_BY_ID, defaultSpawn, findSpawn } from './monsters'
import { uuid } from './storage'

// Reads either our own backup or a SovereignRO MVP Tracker backup (formatVersion 2:
// activeHunt/favorites entries of { id, isFavorite, spawns: [{ map, killedAt, lastKillMarker }] }).
// Returns { timers, favorites, settings? } with fresh timer ids.
export function parseBackup(data) {
  if (data?.app === 'mvp-timer' && Array.isArray(data.timers)) {
    return {
      timers: data.timers.filter((t) => MONSTERS_BY_ID.has(t.monsterId)).map((t) => ({ ...t, id: uuid() })),
      favorites: Array.isArray(data.favorites) ? data.favorites.filter((id) => MONSTERS_BY_ID.has(id)) : null,
      settings: data.settings ?? null,
    }
  }

  if (Array.isArray(data?.activeHunt)) {
    const notes = data.monsterNotes ?? {}
    const timers = []
    for (const entry of data.activeHunt) {
      const monster = MONSTERS_BY_ID.get(entry.id)
      if (!monster) continue
      const known = (entry.spawns ?? []).filter((s) => findSpawn(monster, s.map))
      const killed = known.filter((s) => s.killedAt != null)
      // One timer per map that has a kill; a monster with no kills keeps one stopped timer.
      const spawns = killed.length ? killed : [known[0] ?? { map: defaultSpawn(monster)?.map }]
      for (const s of spawns) {
        if (!s.map) continue
        timers.push({
          id: uuid(),
          monsterId: monster.id,
          map: s.map,
          killedAt: s.killedAt ?? null,
          note: typeof notes[monster.id] === 'string' ? notes[monster.id] : '',
          marker: s.lastKillMarker ? { x: round(s.lastKillMarker.x), y: round(s.lastKillMarker.y) } : null,
        })
      }
    }
    const favorites = [...(data.favorites ?? []), ...data.activeHunt.filter((e) => e.isFavorite)]
      .map((e) => e.id)
      .filter((id, i, all) => MONSTERS_BY_ID.has(id) && all.indexOf(id) === i)
    return { timers, favorites, settings: null }
  }

  throw new Error('Not an MVP Timer or SovereignRO tracker backup')
}

const round = (n) => Math.round(Number(n) * 10) / 10
