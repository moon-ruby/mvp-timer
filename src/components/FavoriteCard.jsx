import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { defaultSpawn, formatRespawn } from '../lib/monsters'
import { Sprite } from './common'

export default function FavoriteCard({ monster, onAdd, onRemove, onInfo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: monster.id })
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`favorite-card${isDragging ? ' favorite-card--dragging' : ''}`}
    >
      <button className="drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
        ⋮⋮
      </button>
      <Sprite monster={monster} size={36} />
      <div className="favorite-card-text">
        <strong>{monster.name}</strong>
        <span className="muted small">{formatRespawn(defaultSpawn(monster))}</span>
      </div>
      <button className="btn btn--primary btn--sm" onClick={onAdd}>
        Add
      </button>
      <button className="icon-btn" onClick={onInfo} aria-label="More info">
        ⓘ
      </button>
      <button className="icon-btn" onClick={onRemove} aria-label="Remove from favorites">
        ✕
      </button>
    </article>
  )
}
