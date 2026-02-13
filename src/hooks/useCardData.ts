/**
 * Hook to load cardData.json and provide lookup by name
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { WavesCardData } from '../components/WavesCard'

let _cache: WavesCardData[] | null = null

export function useCardData() {
  const [cards, setCards] = useState<WavesCardData[]>(_cache || [])

  useEffect(() => {
    if (_cache) return
    fetch('/data/cardData.json')
      .then(r => r.json())
      .then((data: WavesCardData[]) => {
        _cache = data
        setCards(data)
      })
      .catch(console.error)
  }, [])

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
