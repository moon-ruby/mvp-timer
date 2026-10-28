import { useEffect, useRef } from 'react'
import { getTimerStatus } from '../lib/time'
import { playSound } from '../lib/sounds'
import { showNotification } from '../lib/notify'
import { spriteUrl } from '../lib/monsters'

// Fires sound + desktop notification when a timer enters Spawn Possible (and optionally Spawned).
// The first time a timer is seen its state is only recorded, so reloading the page or a friend
// adding an old kill does not set off a burst of alerts.
export function useAlerts(timers, settings, now) {
  const seen = useRef(new Map())

  useEffect(() => {
    const live = new Set()
    for (const t of timers) {
      const key = `${t.id}:${t.killedAt}:${t.map}`
      live.add(key)
      const { state, monster, spawn } = getTimerStatus(t, now)
      const prev = seen.current.get(key)
      seen.current.set(key, state)
      if (!prev || prev === state || !monster) continue

      const enteredWindow = state === 'spawn_window'
      const enteredSpawned = state === 'spawned' && settings.alertOnSpawned
      if (!enteredWindow && !enteredSpawned) continue

      if (settings.soundEnabled) {
        const sound = settings.perMonsterSound[monster.id] ?? settings.sound
        playSound(sound, { volume: settings.volume, repeat: settings.repeat })
      }
      if (settings.notifications) {
        showNotification(enteredWindow ? `${monster.name} can spawn now` : `${monster.name} has spawned`, {
          body: `${spawn.map}${t.note ? ` · ${t.note}` : ''}`,
          icon: spriteUrl(monster.id),
          tag: `${t.id}:${state}`,
        })
      }
    }
    for (const key of seen.current.keys()) if (!live.has(key)) seen.current.delete(key)
  }, [timers, settings, now])
}
