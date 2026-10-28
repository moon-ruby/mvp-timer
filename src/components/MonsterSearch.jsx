import { useMemo, useState } from 'react'
import { defaultSpawn, formatRespawn, searchMonsters } from '../lib/monsters'
import { Badge, Sprite } from './common'

export default function MonsterSearch({ placeholder = 'Search MVP...', onPick, exclude }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const results = useMemo(
    () => (query.trim() ? searchMonsters(query).filter((m) => !exclude?.has(m.id)).slice(0, 12) : []),
    [query, exclude],
  )

  const pick = (m) => {
    onPick(m)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="search">
      <input
        className="input"
        value={query}
        placeholder={placeholder}
        onChange={(e) => (setQuery(e.target.value), setOpen(true))}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => e.key === 'Enter' && results[0] && pick(results[0])}
      />
      {open && query.trim() && (
        <ul className="search-results">
          {results.length === 0 && <li className="search-empty">No monster matches this filter.</li>}
          {results.map((m) => (
            <li key={m.id}>
              <button className="search-result" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(m)}>
                <Sprite monster={m} size={32} />
                <span className="search-result-name">{m.name}</span>
                <Badge monster={m} />
                <span className="search-result-map">
                  {defaultSpawn(m)?.map ?? '—'}
                  {m.spawns.length > 1 && ` +${m.spawns.length - 1}`} · {formatRespawn(defaultSpawn(m))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
