/**
 * CardFromData — Renders a CardPreview from cardData.json by name
 *
 * Looks up the card in cardData.json, converts to CardEditorData,
 * and renders the full themed CardPreview component scaled to fit.
 */
import { useMemo } from 'react'
import CardPreview from '@marketplace/components/editor/CardPreview'
import { useCardData } from '../hooks/useCardData'

interface Props {
  /** Card name to look up in cardData.json */
  name: string
  /** Width in pixels (height auto at 4:3 aspect) */
  width?: number
  /** Optional image override URL */
  imageOverride?: string
  /** Optional className for outer wrapper */
  className?: string
  /** Optional inline style for outer wrapper */
  style?: React.CSSProperties
}

export default function CardFromData({ name, width = 220, imageOverride, className, style }: Props) {
  const { lookup, toEditorData } = useCardData()

  const editorCard = useMemo(() => {
    const raw = lookup(name)
    if (!raw) return null
    return toEditorData(raw, imageOverride)
  }, [name, imageOverride, lookup, toEditorData])

  if (!editorCard) {
    // Fallback: show placeholder while loading or if not found
    return (
      <div
        className={className}
        style={{
          width,
          aspectRatio: '3/4',
          background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: 12,
          ...style,
        }}
      >
        {name || 'Loading...'}
      </div>
    )
  }

  // Scale: CardPreview renders at 400px wide, we scale to target width
  const scale = width / 400

  return (
    <div
      className={className}
      style={{
        width,
        height: width * (4 / 3),
        overflow: 'hidden',
        borderRadius: 4,
        ...style,
      }}
    >
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: 400,
      }}>
        <CardPreview card={editorCard} />
      </div>
    </div>
  )
}
