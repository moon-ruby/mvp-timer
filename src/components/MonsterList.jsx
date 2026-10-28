import { useMemo, useState } from 'react'
import { formatRespawn, searchMonsters } from '../lib/monsters'
import { Badge, Sprite } from './common'

const FILTERS = [
  ['all', 'All'],
  ['mvp', 'MVP'],
  ['miniboss', 'Mini-boss'],
]

export default function MonsterList({ favorites, toggleFavorite, openDialog }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const list = useMemo(() => searchMonsters(query, category), [query, category])
  const favs = useMemo(() => new Set(favorites), [favorites])

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Monster List</h2>
        <span className="muted small">{list.length} monsters</span>
      </header>
      <div className="list-toolbar">
        <div className="segmented">
          {FILTERS.map(([value, label]) => (
            <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>
              {label}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Filter by name or map..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {list.length === 0 && <p className="empty">No monster matches this filter.</p>}
      <ul className="monster-list">
        {list.map((m) => (
          <li key={m.id} className="monster-row">
            <Sprite monster={m} size={40} />
            <div className="monster-row-text">
              <div>
                <strong>{m.name}</strong> <Badge monster={m} />
              </div>
              <div className="muted small">
                {m.spawns.length ? m.spawns.map((s) => `${s.map} (${formatRespawn(s)})`).join(' · ') : 'No known spawn'}
              </div>
            </div>
            <button className="btn btn--primary btn--sm" disabled={!m.spawns.length} onClick={() => openDialog({ type: 'add', monsterId: m.id })}>
              Add to hunt
            </button>
            <button
              className={`icon-btn${favs.has(m.id) ? ' icon-btn--on' : ''}`}
              onClick={() => toggleFavorite(m.id)}
              aria-label={favs.has(m.id) ? 'Remove from favorites' : 'Add to Favorites'}
            >
              {favs.has(m.id) ? '★' : '☆'}
            </button>
            <button className="icon-btn" onClick={() => openDialog({ type: 'info', monsterId: m.id })} aria-label="More info">
              ⓘ
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
