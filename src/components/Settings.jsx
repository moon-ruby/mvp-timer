import { useEffect, useRef, useState } from 'react'
import { MONSTERS_BY_ID } from '../lib/monsters'
import { notificationPermission, requestNotifications } from '../lib/notify'
import { SOUNDS, playSound } from '../lib/sounds'
import { parseBackup } from '../lib/importBackup'
import { ConfirmButton } from './common'
import MonsterSearch from './MonsterSearch'

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches)
  useEffect(() => {
    const onPrompt = (e) => (e.preventDefault(), setPrompt(e))
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  return { prompt, setPrompt, installed }
}

export default function Settings({ settings, setSettings, hunt, favorites, setFavorites, roomId, onResetAll }) {
  const [permission, setPermission] = useState(notificationPermission)
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)
  const install = useInstallPrompt()
  const set = (patch) => setSettings((s) => ({ ...s, ...patch }))
  const preview = (id) => playSound(id, { volume: settings.volume, repeat: 1 })

  const enableNotifications = async () => {
    const p = await requestNotifications()
    setPermission(p)
    set({ notifications: p === 'granted' })
  }

  const exportBackup = () => {
    const data = { app: 'mvp-timer', version: 1, exportedAt: new Date().toISOString(), timers: hunt.timers, favorites, settings }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `mvp-timer-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = async (file) => {
    try {
      // Fresh ids (from parseBackup) so restoring into a shared room never collides with another room's rows.
      const { timers, favorites: favs, settings: saved } = parseBackup(JSON.parse(await file.text()))
      await hunt.replaceAll(timers)
      if (favs) setFavorites(favs)
      if (saved) setSettings((s) => ({ ...s, ...saved }))
      setMessage(`Backup restored: ${timers.length} timers${favs ? `, ${favs.length} favorites` : ''}.`)
    } catch (e) {
      setMessage(`Restore failed: ${e.message}`)
    }
  }

  const overrides = Object.entries(settings.perMonsterSound)

  return (
    <div className="settings">
      {message && <p className="toast">{message}</p>}

      <section className="panel">
        <h2>Notification settings</h2>
        <div className="setting-row">
          <div>
            <strong>Desktop notifications</strong>
            <p className="muted small">
              {permission === 'unsupported' &&
                "This browser or connection doesn't support desktop notifications (needs a secure context: https or localhost)."}
              {permission === 'denied' && 'Notifications are blocked for this site in your browser settings.'}
              {permission === 'granted' && 'Shows a notification when a timer hits Spawn Possible.'}
              {permission === 'default' && 'Get notified even when this tab is in the background.'}
            </p>
          </div>
          {permission === 'granted' ? (
            <label className="switch">
              <input type="checkbox" checked={settings.notifications} onChange={(e) => set({ notifications: e.target.checked })} />
              <span />
            </label>
          ) : (
            <button className="btn btn--primary" disabled={permission !== 'default'} onClick={enableNotifications}>
              Enable desktop notifications
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Spawn alert sound</h2>
        <div className="setting-row">
          <div>
            <strong>Play a sound on Spawn Possible</strong>
            <p className="muted small">Plays once when an MVP or mini-boss becomes Spawn Possible.</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => set({ soundEnabled: e.target.checked })} />
            <span />
          </label>
        </div>
        <div className="setting-row">
          <strong>Also alert on Spawned</strong>
          <label className="switch">
            <input type="checkbox" checked={settings.alertOnSpawned} onChange={(e) => set({ alertOnSpawned: e.target.checked })} />
            <span />
          </label>
        </div>
        <div className="sound-grid">
          {SOUNDS.map((s) => (
            <div key={s.id} className={`sound-option${settings.sound === s.id ? ' sound-option--active' : ''}`}>
              <button className="sound-option-pick" onClick={() => (set({ sound: s.id }), preview(s.id))}>
                {s.label}
              </button>
              <button className="icon-btn" onClick={() => preview(s.id)} aria-label={`Preview ${s.label}`}>
                ▶
              </button>
            </div>
          ))}
        </div>
        <label className="setting-row">
          <strong>Volume</strong>
          <input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(e) => set({ volume: Number(e.target.value) })} />
        </label>
        <label className="setting-row">
          <strong>Repeat</strong>
          <select className="input input--narrow" value={settings.repeat} onChange={(e) => set({ repeat: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}×
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel">
        <h2>Per-MVP sound</h2>
        <p className="muted small">Give a specific MVP or mini-boss its own alert sound, overriding the default sound above just for that one.</p>
        <MonsterSearch
          placeholder="Choose a monster..."
          onPick={(m) => set({ perMonsterSound: { ...settings.perMonsterSound, [m.id]: settings.sound } })}
        />
        <ul className="override-list">
          {overrides.map(([id, sound]) => (
            <li key={id} className="setting-row">
              <strong>{MONSTERS_BY_ID.get(Number(id))?.name ?? id}</strong>
              <span className="spacer" />
              <select
                className="input input--narrow"
                value={sound}
                onChange={(e) => (set({ perMonsterSound: { ...settings.perMonsterSound, [id]: e.target.value } }), preview(e.target.value))}
              >
                {SOUNDS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                className="btn btn--sm"
                onClick={() => {
                  const { [id]: _, ...rest } = settings.perMonsterSound
                  set({ perMonsterSound: rest })
                }}
              >
                Remove override
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Timers</h2>
        <div className="setting-row">
          <div>
            <strong>Use server time (UTC)</strong>
            <p className="muted small">Kill times, spawn windows and the "At time" input use the server clock, like the MVP tomb. Off = your local time.</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.timeZone !== 'local'}
              onChange={(e) => set({ timeZone: e.target.checked ? 'server' : 'local' })}
            />
            <span />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <strong>Let timers go negative once Spawned</strong>
            <p className="muted small">Shows how long ago the window closed instead of "UP".</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.goNegative} onChange={(e) => set({ goNegative: e.target.checked })} />
            <span />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p className="muted small">
          Accepts MVP Timer backups and SovereignRO MVP Tracker backups. Restoring replaces everything currently in Active Hunt
          {roomId ? ' (for everyone in this room)' : ''} and your Favorites.
        </p>
        <div className="row">
          <button className="btn" onClick={exportBackup}>
            Download backup JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Upload backup JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files[0] && importBackup(e.target.files[0])} />
        </div>
      </section>

      <section className="panel">
        <h2>App</h2>
        <div className="setting-row">
          <strong>Install MVP Timer</strong>
          {install.installed ? (
            <span className="muted small">Already installed as an app.</span>
          ) : install.prompt ? (
            <button
              className="btn btn--primary"
              onClick={async () => {
                install.prompt.prompt()
                const { outcome } = await install.prompt.userChoice
                install.setPrompt(null)
                if (outcome !== 'accepted') setMessage('Install was dismissed, you can try again anytime.')
              }}
            >
              Install
            </button>
          ) : (
            <span className="muted small">Use your browser menu → "Install app" / "Add to Home Screen".</span>
          )}
        </div>
        <div className="setting-row">
          <div>
            <strong>Reset everything</strong>
            <p className="muted small">Clears favorites, settings and {roomId ? 'all timers in this shared room' : 'your timers'}.</p>
          </div>
          <ConfirmButton className="btn btn--danger" onConfirm={() => (onResetAll(), setMessage("Everything's been reset."))}>
            Reset everything
          </ConfirmButton>
        </div>
      </section>
    </div>
  )
}
