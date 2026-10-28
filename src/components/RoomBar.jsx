import { useState } from 'react'
import { supabaseConfigured } from '../lib/supabase'

const STATUS = {
  local: ['Local only', 'off'],
  connecting: ['Connecting…', 'warn'],
  reconnecting: ['Reconnecting…', 'warn'],
  live: ['Live', 'ok'],
  error: ['Error', 'bad'],
}

export default function RoomBar({ roomId, status, error, onCreate, onJoin, onLeave }) {
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [label, tone] = STATUS[status] ?? STATUS.local

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  if (!supabaseConfigured) {
    return (
      <div className="room-bar">
        <span className="dot dot--off" /> Local only
        <span className="muted small">— shared rooms need Supabase keys in .env.local</span>
      </div>
    )
  }

  if (!roomId) {
    return (
      <div className="room-bar">
        <span className="dot dot--off" /> Local only
        <span className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={onCreate}>
          Create shared room
        </button>
        <form className="row" onSubmit={(e) => (e.preventDefault(), joinCode.trim() && onJoin(joinCode.trim()))}>
          <input className="input input--narrow" placeholder="Room code or link" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
          <button className="btn btn--sm">Join</button>
        </form>
      </div>
    )
  }

  return (
    <div className="room-bar">
      <span className={`dot dot--${tone}`} /> {label}
      <span className="muted small">
        Room <code>{roomId}</code>
      </span>
      {error && <span className="error small">{error}</span>}
      <span className="spacer" />
      <button className="btn btn--primary btn--sm" onClick={copy}>
        {copied ? 'Link copied!' : 'Copy invite link'}
      </button>
      <button className="btn btn--sm" onClick={onLeave}>
        Leave room
      </button>
    </div>
  )
}
