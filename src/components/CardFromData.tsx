/**
 * CardFromData — Renders a WavesCard from cardData.json by name
 *
 * Looks up the card in cardData.json and renders the WavesCard component
 * (the canonical card layout matching our Puppeteer renders).
 */
import { useMemo } from 'react'
import WavesCard from './WavesCard'
import { useCardData } from '../hooks/useCardData'

interface Props {
  /** Card name to look up in cardData.json */
  name: string
  /** Width in pixels (height auto at 3:4 aspect) */
  width?: number
  /** Optional image override URL */
  imageOverride?: string
  /** Optional className for outer wrapper */
  className?: string
  /** Optional inline style */
  style?: React.CSSProperties
}

export default function CardFromData({ name, width = 0, imageOverride, className, style }: Props) {
  const { lookup } = useCardData()

  const raw = useMemo(() => lookup(name), [name, lookup])

  if (!raw) {
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
      card={raw}
      width={width}
      artSrc={imageOverride}
      className={className}
      style={style}
    />
  )
}
