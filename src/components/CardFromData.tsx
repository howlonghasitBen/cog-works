/**
 * CardFromData — Renders a WavesCard from cardData.json by name
 *
 * Looks up the card in cardData.json and renders the WavesCard component
 * (the canonical card layout matching our Puppeteer renders).
 *
 * For cards not in cardData.json (e.g. newly minted), pass `fallbackData`
 * to provide a basic WavesCardData object from on-chain info.
 */
import { useMemo } from 'react'
import WavesCard, { type WavesCardData } from './WavesCard'
import { useCardData } from '../hooks/useCardData'

/** Build a default WavesCardData for a card with just a name/symbol */
export function buildFallbackCard(name: string, symbol?: string): WavesCardData {
  return {
    name,
    subtitle: symbol || undefined,
    level: '1',
    type: 'Creature',
    rarity: 'Common',
    flavorText: 'A newly forged card enters the Whirlpool.',
    artist: 'WHIRLPOOL',
    hp: { value: '?', color: 'radial-gradient(circle, #dc143c, #8b0000)', textColor: '#ffffff' },
    manaCost: { value: '?', color: 'radial-gradient(circle, #4169e1, #0000cd)', textColor: '#ffffff' },
    crit: { value: '?', color: 'linear-gradient(135deg, gold, orange)', textColor: '#1a1a1a' },
    theme: {
      background: 'linear-gradient(145deg, #1a1d2e, #2a2d3e, #1a1d2e)',
      header: {
        background: 'linear-gradient(135deg, #c8a55a, #a08030, #c8a55a)',
        color: '#1a1d2e',
        textShadow: 'none',
      },
      imageArea: {
        background: 'linear-gradient(145deg, #22252f, #2a2d3e)',
        border: '2px solid #c8a55a40',
      },
      typeSection: {
        background: 'linear-gradient(135deg, #c8a55a80, #a0803080)',
        color: '#f0e6d0',
      },
      flavorText: {
        background: 'linear-gradient(145deg, #1a1d2e, #22252f)',
        color: '#c0b090',
        accentColor: '#c8a55a',
        border: '1px solid #c8a55a30',
      },
      bottomSection: { background: 'linear-gradient(135deg, #2a2d3e, #1a1d2e)' },
      stat: { background: 'rgba(26,29,46,0.6)', border: '1px solid #c8a55a40', color: '#c8a55a' },
      rarity: { background: 'linear-gradient(135deg, #c8a55a, #e8c96a)', color: '#1a1d2e', border: '1px solid #c8a55a' },
    },
  }
}

interface Props {
  /** Card name to look up in cardData.json */
  name: string
  /** Width in pixels (height auto at 3:4 aspect) */
  width?: number
  /** Optional image override URL */
  imageOverride?: string
  /** Fallback data for cards not in cardData.json (e.g. newly minted) */
  fallbackData?: WavesCardData
  /** Optional className for outer wrapper */
  className?: string
  /** Optional inline style */
  style?: React.CSSProperties
}

export default function CardFromData({ name, width = 0, imageOverride, fallbackData, className, style }: Props) {
  const { lookup } = useCardData()

  const cardData = useMemo(() => {
    return lookup(name) || fallbackData || null
  }, [name, lookup, fallbackData])

  if (!cardData) {
    return (
      <div
        className={className}
        style={{
          width: width || '100%', aspectRatio: '3/4',
          background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#666', fontSize: 12,
          ...style,
        }}
      >
        {name || 'Loading...'}
      </div>
    )
  }

  return (
    <WavesCard
      card={cardData}
      width={width}
      artSrc={imageOverride}
      className={className}
      style={style}
    />
  )
}
