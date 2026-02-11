import { useState } from 'react'
import { CARD_PARTS, createDefaultCard } from '@marketplace/components/editor/types'
import type { CardEditorData } from '@marketplace/components/editor/types'
import CogPartSelector from '../components/CogPartSelector'
import CogPartEditor from '../components/CogPartEditor'
import CardPreview from '@marketplace/components/editor/CardPreview'

export default function MintPage() {
  const [card, setCard] = useState<CardEditorData>(createDefaultCard())
  const [selectedPart, setSelectedPart] = useState<string>('identity')

  const updateField = (key: string, value: unknown) => {
    setCard(prev => {
      if (key.startsWith('stats.')) {
        const statKey = key.split('.')[1]
        return { ...prev, stats: { ...prev.stats, [statKey]: value } }
      }
      return { ...prev, [key]: value }
    })
  }

  const updateFields = (updates: Record<string, string | number>) => {
    setCard(prev => {
      const next = { ...prev, stats: { ...prev.stats } }
      for (const [key, value] of Object.entries(updates)) {
        if (key.startsWith('stats.')) {
          const statKey = key.split('.')[1]
          ;(next.stats as Record<string, unknown>)[statKey] = value
        } else {
          ;(next as Record<string, unknown>)[key] = value
        }
      }
      return next
    })
  }

  return (
    <div style={{ marginTop: 60, width: '100%', minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center' }}>
      <div style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'flex-start',
          width: '100%',
        }}>
          {/* Left — Part Selector */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <CogPartSelector
              parts={CARD_PARTS}
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
            />
          </div>

          {/* Center — Live Preview */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <CardPreview card={card} />
          </div>

          {/* Right — Part Editor */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <CogPartEditor
              part={selectedPart}
              partSchema={CARD_PARTS[selectedPart]}
              card={card}
              onUpdateField={updateField}
              onUpdateFields={updateFields}
            />

            <div style={{
              marginTop: 24,
              padding: 20,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#92400e', fontFamily: "'Inter Tight', sans-serif", margin: '0 0 8px' }}>
                🌊 Minting Coming Soon
              </p>
              <p style={{ fontSize: 14, color: '#b45309', margin: 0, lineHeight: 1.5 }}>
                On-chain card minting is under development. Design your card now — you'll be able to mint it when we launch.
              </p>
            </div>
          </div>
        </div>
      </div>
  )
}
