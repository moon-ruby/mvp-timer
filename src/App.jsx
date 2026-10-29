import { useCallback, useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'
import InfoDialog from './components/InfoDialog'
import MarkerDialog from './components/MarkerDialog'
import MonsterList from './components/MonsterList'
import RoomBar from './components/RoomBar'
import Settings from './components/Settings'
import TimerDialog from './components/TimerDialog'
import { useAlerts } from './hooks/useAlerts'
import { useLocalState } from './hooks/useLocalState'
import { useNow } from './hooks/useNow'
import { useTimers } from './hooks/useTimers'
import { unlockAudio } from './lib/sounds'
import { formatClock } from './lib/time'
import { randomRoomId, uuid } from './lib/storage'

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  sound: 'bell',
  volume: 0.7,
  repeat: 1,
  alertOnSpawned: false,
  notifications: false,
  goNegative: false,
  timeZone: 'server',
  perMonsterSound: {},
}

const PAGES = [
  ['dashboard', 'Dashboard'],
  ['monsters', 'Monster List'],
  ['settings', 'Settings'],
]

const readRoom = () => new URLSearchParams(window.location.search).get('room')?.trim() || null

function setRoomInUrl(roomId) {
  const url = new URL(window.location.href)
  if (roomId) url.searchParams.set('room', roomId)
  else url.searchParams.delete('room')
  window.history.pushState({}, '', url)
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [roomId, setRoomId] = useState(readRoom)
  const [settings, setSettings] = useLocalState('mvp.settings', DEFAULT_SETTINGS)
  const [favorites, setFavorites] = useLocalState('mvp.favorites', [])
  const [dialog, setDialog] = useState(null)
  const [pendingSeed, setPendingSeed] = useState(null)
  const hunt = useTimers(roomId)
  const now = useNow()

  useAlerts(hunt.timers, settings, now)

  useEffect(() => {
    const onPop = () => setRoomId(readRoom())
    window.addEventListener('popstate', onPop)
    window.addEventListener('pointerdown', unlockAudio, { once: true })
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const switchRoom = (id) => {
    setRoomInUrl(id)
    setRoomId(id)
  }

  const createRoom = () => {
    // Bring the current local timers along into the new room.
    const local = hunt.timers.map((t) => ({ ...t, id: uuid() }))
    const id = randomRoomId()
    switchRoom(id)
    if (local.length) setPendingSeed({ id, timers: local })
  }

  // Seeding waits until useTimers has switched to the new room.
  useEffect(() => {
    if (pendingSeed && pendingSeed.id === roomId && hunt.status === 'live') {
      hunt.replaceAll(pendingSeed.timers)
      setPendingSeed(null)
    }
  }, [pendingSeed, roomId, hunt])

  const joinRoom = (input) => {
    let code = input
    try {
      code = new URL(input).searchParams.get('room') ?? input
    } catch {}
    code = code.replace(/[^a-zA-Z0-9_-]/g, '')
    if (code.length >= 8) switchRoom(code)
  }

  const toggleFavorite = useCallback(
    (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    [setFavorites],
  )

  const utc = settings.timeZone !== 'local'
  const closeDialog = useCallback(() => setDialog(null), [])
  const dialogTimer = dialog?.timerId ? hunt.timers.find((t) => t.id === dialog.timerId) : null

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="./icon.svg" alt="" width="28" height="28" />
          <span>MVP Timer</span>
        </div>
        <div className="server-clock">
          {utc ? 'Server' : 'Local'} <strong>{formatClock(now, utc, true)}</strong>
          {utc ? ' UTC' : ''}
        </div>
        <nav className="tabs">
          {PAGES.map(([id, label]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <RoomBar
        roomId={roomId}
        status={hunt.status}
        error={hunt.error}
        onCreate={createRoom}
        onJoin={joinRoom}
        onLeave={() => switchRoom(null)}
      />

      <main className="content">
        {page === 'dashboard' && (
          <Dashboard
            hunt={hunt}
            favorites={favorites}
            setFavorites={setFavorites}
            toggleFavorite={toggleFavorite}
            settings={settings}
            now={now}
            openDialog={setDialog}
          />
        )}
        {page === 'monsters' && <MonsterList favorites={favorites} toggleFavorite={toggleFavorite} openDialog={setDialog} />}
        {page === 'settings' && (
          <Settings
            settings={settings}
            setSettings={setSettings}
            hunt={hunt}
            favorites={favorites}
            setFavorites={setFavorites}
            roomId={roomId}
            onResetAll={() => {
              hunt.replaceAll([])
              setFavorites([])
              setSettings(DEFAULT_SETTINGS)
            }}
          />
        )}
      </main>

      {dialog?.type === 'add' && (
        <TimerDialog
          monsterId={dialog.monsterId}
          utc={utc}
          onClose={closeDialog}
          onSave={(t) => {
            hunt.add({ id: uuid(), ...t })
            closeDialog()
            setPage('dashboard')
          }}
        />
      )}
      {dialog?.type === 'edit' && dialogTimer && (
        <TimerDialog timer={dialogTimer} utc={utc} onClose={closeDialog} onSave={(t) => (hunt.update(dialogTimer.id, t), closeDialog())} />
      )}
      {dialog?.type === 'marker' && dialogTimer && (
        <MarkerDialog timer={dialogTimer} onClose={closeDialog} onSave={(marker) => hunt.update(dialogTimer.id, { marker })} />
      )}
      {dialog?.type === 'info' && <InfoDialog monsterId={dialog.monsterId} onClose={closeDialog} />}
    </div>
  )
}
