/**
 * Hook to load cardData.json and provide lookup + conversion to CardEditorData
 */
import { useState, useEffect, useMemo } from 'react'
import type { CardEditorData } from '@marketplace/components/editor/types'

export interface RawCard {
  name: string
  subtitle?: string
  level?: string | number
  image?: string
  type?: string
  stats?: { hp?: number; attack?: number; defense?: number; mana?: number; crit?: number } | null
  flavorText?: string
  artist?: string
  rarity?: string
  hp?: { value: string; color: string; textColor?: string }
  manaCost?: { value: string; color: string; textColor?: string } | { value: string; color: string; textColor?: string }[]
  crit?: { value: string; color: string; textColor?: string }
  theme?: any
  token_id?: number
}

let _cache: RawCard[] | null = null

export function useCardData() {
  const [cards, setCards] = useState<RawCard[]>(_cache || [])

  useEffect(() => {
    if (_cache) return
    fetch('/data/cardData.json')
      .then(r => r.json())
      .then((data: RawCard[]) => {
        _cache = data
        setCards(data)
      })
      .catch(console.error)
  }, [])

  const byName = useMemo(() => {
    const map = new Map<string, RawCard>()
    cards.forEach(c => map.set(c.name.toLowerCase(), c))
    return map
  }, [cards])

  /** Look up raw card by name (case-insensitive) */
  function lookup(name: string): RawCard | undefined {
    return byName.get(name.toLowerCase())
  }

  /** Convert raw card to CardEditorData for CardPreview */
  function toEditorData(raw: RawCard, artOverride?: string): CardEditorData {
    // Resolve image: prefer arts/ dir for local, otherwise use raw.image
    let imageData = artOverride || ''
    if (!imageData && raw.image) {
      if (raw.image.startsWith('/images/')) {
        // surf-works relative path → use arts/ version
        const fname = raw.image.split('/').pop()
        imageData = `/images/card-images/arts/${fname}`
      } else {
        imageData = raw.image
      }
    }

    const manaArr = Array.isArray(raw.manaCost)
      ? raw.manaCost
      : raw.manaCost ? [raw.manaCost] : []

    return {
      name: raw.name,
      subtitle: raw.subtitle || '',
      type: raw.type || 'Creature',
      level: typeof raw.level === 'number' ? raw.level : 1,
      imageData,
      moveName: '',
      flavorText: raw.flavorText || '',
      artist: raw.artist || '◆Waves TCG◆',
      rarity: raw.rarity || '★1/1★',
      stats: {
        hp: raw.stats?.hp ?? 0,
        attack: raw.stats?.attack ?? 0,
        defense: raw.stats?.defense ?? 0,
        mana: raw.stats?.mana ?? 0,
        crit: raw.stats?.crit ?? 0,
      },
      manaCost: manaArr.map(m => ({
        type: 'mana',
        value: parseInt(m.value) || 0,
        color: m.color || 'radial-gradient(circle, #4169e1, #0000cd)',
        textColor: m.textColor || '#fff',
      })),
      colors: {},
      theme: raw.theme || {},
    }
  }

  return { cards, lookup, toEditorData }
}
