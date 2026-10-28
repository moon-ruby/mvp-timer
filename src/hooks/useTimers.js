import { useCallback, useEffect, useRef, useState } from 'react'
import { load, save } from '../lib/storage'
import { roomClient, rowToTimer, timerToRow, supabaseConfigured } from '../lib/supabase'

const LOCAL_KEY = 'mvp.timers'
const sortTimers = (list) => [...list].sort((a, b) => a.position - b.position)

// Newer updatedAt wins, so out-of-order broadcasts never roll a timer back.
function mergeRows(list, rows) {
  const map = new Map(list.map((t) => [t.id, t]))
  for (const r of rows) {
    const cur = map.get(r.id)
    if (!cur || (r.updatedAt ?? 0) >= (cur.updatedAt ?? 0)) map.set(r.id, r)
  }
  return sortTimers([...map.values()])
}

// Timers live in localStorage when no room is set, or in Supabase (shared) when it is.
// Writes go through the REST API; a broadcast on the room channel tells friends to apply them.
export function useTimers(roomId) {
  const shared = Boolean(roomId)
  const [timers, setTimers] = useState(() => (shared ? [] : sortTimers(load(LOCAL_KEY, []))))
  const [status, setStatus] = useState(shared ? 'connecting' : 'local')
  const [error, setError] = useState(null)
  const channelRef = useRef(null)
  const timersRef = useRef(timers)
  timersRef.current = timers

  const client = shared ? roomClient(roomId) : null

  const refetch = useCallback(async () => {
    if (!client) return
    const { data, error: err } = await client.from('timers').select('*').eq('room_id', roomId).order('position')
    if (err) {
      setError(err.message)
      setStatus('error')
      return
    }
    setError(null)
    setTimers(sortTimers(data.map(rowToTimer)))
  }, [client, roomId])

  useEffect(() => {
    if (!shared) {
      setTimers(sortTimers(load(LOCAL_KEY, [])))
      setStatus('local')
      return
    }
    if (!client) {
      setStatus('error')
      setError(supabaseConfigured ? 'Could not create Supabase client.' : 'Supabase is not configured (.env.local).')
      return
    }
    setTimers([])
    setStatus('connecting')
    refetch()

    const channel = client
      .channel(`room:${roomId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'upsert' }, ({ payload }) => setTimers((cur) => mergeRows(cur, payload.timers)))
      .on('broadcast', { event: 'delete' }, ({ payload }) =>
        setTimers((cur) => cur.filter((t) => !payload.ids.includes(t.id))),
      )
      .on('broadcast', { event: 'reset' }, () => refetch())
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          setStatus('live')
          refetch()
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('reconnecting')
        else if (s === 'CLOSED') setStatus('connecting')
      })
    channelRef.current = channel

    // Catch up on anything missed while the tab was asleep.
    const onVisible = () => document.visibilityState === 'visible' && refetch()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      client.removeChannel(channel)
      channelRef.current = null
    }
  }, [shared, client, roomId, refetch])

  useEffect(() => {
    if (!shared) save(LOCAL_KEY, timers)
  }, [shared, timers])

  const broadcast = (event, payload) => channelRef.current?.send({ type: 'broadcast', event, payload })

  const persist = useCallback(
    async (changed) => {
      if (!client || !changed.length) return
      const { error: err } = await client.from('timers').upsert(changed.map((t) => timerToRow(t, roomId)))
      if (err) {
        setError(err.message)
        refetch()
        return
      }
      setError(null)
      broadcast('upsert', { timers: changed })
    },
    [client, roomId, refetch],
  )

  const add = useCallback(
    (timer) => {
      const position = timersRef.current.reduce((max, t) => Math.max(max, t.position + 1), 0)
      const t = { ...timer, position, updatedAt: Date.now() }
      setTimers((cur) => sortTimers([...cur, t]))
      persist([t])
    },
    [persist],
  )

  const update = useCallback(
    (id, patch) => {
      const cur = timersRef.current.find((t) => t.id === id)
      if (!cur) return
      const t = { ...cur, ...patch, updatedAt: Date.now() }
      setTimers((list) => list.map((x) => (x.id === id ? t : x)))
      persist([t])
    },
    [persist],
  )

  const remove = useCallback(
    async (id) => {
      setTimers((list) => list.filter((t) => t.id !== id))
      if (!client) return
      const { error: err } = await client.from('timers').delete().eq('id', id)
      if (err) return setError(err.message), refetch()
      broadcast('delete', { ids: [id] })
    },
    [client, refetch],
  )

  const reorder = useCallback(
    (orderedIds) => {
      const now = Date.now()
      const byId = new Map(timersRef.current.map((t) => [t.id, t]))
      const next = orderedIds.map((id, i) => ({ ...byId.get(id), position: i }))
      const changed = next.filter((t) => byId.get(t.id).position !== t.position).map((t) => ({ ...t, updatedAt: now }))
      setTimers(next.map((t) => changed.find((c) => c.id === t.id) ?? t))
      persist(changed)
    },
    [persist],
  )

  // Replace the whole list (clear all, restore backup, copy local timers into a new room).
  const replaceAll = useCallback(
    async (list) => {
      const now = Date.now()
      const next = list.map((t, i) => ({ ...t, position: i, updatedAt: now }))
      setTimers(next)
      if (!client) return
      const del = await client.from('timers').delete().eq('room_id', roomId)
      const ins = next.length ? await client.from('timers').insert(next.map((t) => timerToRow(t, roomId))) : {}
      const err = del.error || ins.error
      if (err) return setError(err.message), refetch()
      broadcast('reset', {})
    },
    [client, roomId, refetch],
  )

  return { timers, status, error, add, update, remove, reorder, replaceAll }
}
