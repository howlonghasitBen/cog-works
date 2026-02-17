/**
 * Hook to load cardData.json and provide lookup by name
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { WavesCardData } from '../components/WavesCard'

let _cache: WavesCardData[] | null = null
let _version = 0
const _listeners = new Set<() => void>()

/** Call after minting a new card to refresh cardData.json across all components */
export function invalidateCardData() {
  _cache = null
  _version++
  _listeners.forEach(fn => fn())
}

export function useCardData() {
  const [cards, setCards] = useState<WavesCardData[]>(_cache || [])
  const [ver, setVer] = useState(_version)

  useEffect(() => {
    const listener = () => setVer(v => v + 1)
    _listeners.add(listener)
    return () => { _listeners.delete(listener) }
  }, [])

  useEffect(() => {
    if (_cache && _version === ver) return
    fetch('/data/cardData.json')
      .then(r => r.json())
      .then((data: WavesCardData[]) => {
        // Backward compat: old cards have subtitle = move name, no moveName field
        // New cards have subtitle = card subtitle, moveName = move name
        data.forEach(c => {
          if (c.subtitle && !c.moveName) {
            c.moveName = c.subtitle
            c.subtitle = undefined
          }
        })
        _cache = data
        setCards(data)
      })
      .catch(console.error)
  }, [ver])

  const byName = useMemo(() => {
    const map = new Map<string, WavesCardData>()
    cards.forEach(c => map.set(c.name.toLowerCase(), c))
    return map
  }, [cards])

  const lookup = useCallback((name: string): WavesCardData | undefined => {
    return byName.get(name.toLowerCase())
  }, [byName])

  return { cards, lookup }
}
