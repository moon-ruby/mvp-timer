import { useEffect, useState } from 'react'
import { load, save } from '../lib/storage'

export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    const stored = load(key, undefined)
    return stored === undefined ? initial : initial && typeof initial === 'object' && !Array.isArray(initial) ? { ...initial, ...stored } : stored
  })
  useEffect(() => save(key, value), [key, value])
  return [value, setValue]
}
