import { useMemo } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { MONSTERS_BY_ID } from '../lib/monsters'
import { ConfirmButton } from './common'
import FavoriteCard from './FavoriteCard'
import MonsterSearch from './MonsterSearch'
import TimerCard from './TimerCard'

function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
}

export default function Dashboard({ hunt, favorites, setFavorites, toggleFavorite, settings, now, openDialog }) {
  const sensors = useDndSensors()
  const favoriteSet = useMemo(() => new Set(favorites), [favorites])
  const { timers } = hunt

  const onHuntDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = timers.map((t) => t.id)
    hunt.reorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }
  const onFavDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setFavorites((f) => arrayMove(f, f.indexOf(active.id), f.indexOf(over.id)))
  }

  return (
    <div className="dashboard">
      <section className="panel">
        <header className="panel-header">
          <h2>Active Hunt</h2>
          <span className="muted small">{timers.length ? 'Drag & Drop your active hunt' : ''}</span>
          <span className="spacer" />
          {timers.length > 0 && (
            <ConfirmButton className="btn btn--danger btn--sm" onConfirm={() => hunt.replaceAll([])}>
              Clear all
            </ConfirmButton>
          )}
        </header>
        <MonsterSearch placeholder="Add an MVP to your hunt…" onPick={(m) => openDialog({ type: 'add', monsterId: m.id })} />
        {timers.length === 0 ? (
          <p className="empty">No timers yet. Search a monster above or pick one from your favorites.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onHuntDragEnd}>
            <SortableContext items={timers.map((t) => t.id)} strategy={rectSortingStrategy}>
              <div className="hunt-grid">
                {timers.map((t) => (
                  <TimerCard
                    key={t.id}
                    timer={t}
                    now={now}
                    settings={settings}
                    isFavorite={favoriteSet.has(t.monsterId)}
                    actions={{
                      restart: () => hunt.update(t.id, { killedAt: Date.now() }),
                      stop: () => hunt.update(t.id, { killedAt: null }),
                      edit: () => openDialog({ type: 'edit', timerId: t.id }),
                      marker: () => openDialog({ type: 'marker', timerId: t.id }),
                      info: () => openDialog({ type: 'info', monsterId: t.monsterId }),
                      favorite: () => toggleFavorite(t.monsterId),
                      remove: () => hunt.remove(t.id),
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Favorites</h2>
          <span className="muted small">{favorites.length ? 'Drag & Drop your favorites' : ''}</span>
        </header>
        <MonsterSearch
          placeholder="Add an MVP to your favorites…"
          exclude={favoriteSet}
          onPick={(m) => setFavorites((f) => [...f, m.id])}
        />
        {favorites.length === 0 ? (
          <p className="empty">Star monsters you hunt often to start timers in one click.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onFavDragEnd}>
            <SortableContext items={favorites} strategy={rectSortingStrategy}>
              <div className="favorite-grid">
                {favorites.map((id) => {
                  const m = MONSTERS_BY_ID.get(id)
                  return (
                    m && (
                      <FavoriteCard
                        key={id}
                        monster={m}
                        onAdd={() => openDialog({ type: 'add', monsterId: id })}
                        onInfo={() => openDialog({ type: 'info', monsterId: id })}
                        onRemove={() => toggleFavorite(id)}
                      />
                    )
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  )
}
