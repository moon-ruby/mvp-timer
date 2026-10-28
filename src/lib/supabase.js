import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && key)

const clients = new Map()

// One client per room: the room code travels in the x-room-id header that RLS checks.
export function roomClient(roomId) {
  if (!supabaseConfigured) return null
  if (!clients.has(roomId)) {
    clients.set(
      roomId,
      createClient(url, key, {
        global: { headers: { 'x-room-id': roomId } },
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    )
  }
  return clients.get(roomId)
}

export const rowToTimer = (r) => ({
  id: r.id,
  monsterId: r.monster_id,
  map: r.map,
  killedAt: r.killed_at ? Date.parse(r.killed_at) : null,
  note: r.note ?? '',
  marker: r.marker ?? null,
  position: r.position ?? 0,
  updatedAt: Date.parse(r.updated_at),
})

export const timerToRow = (t, roomId) => ({
  id: t.id,
  room_id: roomId,
  monster_id: t.monsterId,
  map: t.map,
  killed_at: t.killedAt == null ? null : new Date(t.killedAt).toISOString(),
  note: t.note ?? '',
  marker: t.marker ?? null,
  position: t.position ?? 0,
  updated_at: new Date(t.updatedAt ?? Date.now()).toISOString(),
})
