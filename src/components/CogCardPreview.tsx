/** Card preview with HP/Mana/Crit orbs floating above */
import type { CardEditorData } from '@marketplace/components/editor/types'
import CardPreview from '@marketplace/components/editor/CardPreview'

interface Props {
  card: CardEditorData
}

const orbs = [
  { key: 'hp', label: 'HP', color: '#dc2626', shadow: '#991b1b', get: (c: CardEditorData) => c.stats?.hp || 0 },
  { key: 'mana', label: 'MP', color: '#2563eb', shadow: '#1e40af', get: (c: CardEditorData) => c.stats?.mana || 0 },
  { key: 'crit', label: '⚡', color: '#d97706', shadow: '#92400e', get: (c: CardEditorData) => c.stats?.crit || 0 },
]

export default function CogCardPreview({ card }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Stat orbs */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        {orbs.map(orb => (
          <div key={orb.key} style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${orb.color}, ${orb.shadow})`,
            border: '3px solid #1a1a1a',
            boxShadow: `0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.3), 0 0 12px ${orb.color}44`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{
              fontSize: 8,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.05em',
              lineHeight: 1,
            }}>
              {orb.label}
            </span>
            <span style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1,
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}>
              {orb.get(card)}
            </span>
          </div>
        ))}
      </div>

      {/* Original card preview */}
      <CardPreview card={card} />
    </div>
  )
}
