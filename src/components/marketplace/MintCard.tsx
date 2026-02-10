import { useState } from 'react'
import { CARD_PARTS, createDefaultCard } from './editor/types'
import type { CardEditorData } from './editor/types'
import PartSelector from './editor/PartSelector'
import PartEditor from './editor/PartEditor'
import CardPreview from './editor/CardPreview'

interface MintCardProps {
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void
}

export default function MintCard({ onToast: _onToast }: MintCardProps) {
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
    <div className="max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
        Create Card
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Design your Whirlpool card with the editor below.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 items-start">
        <div>
          <div className="bg-[#1a1d2e] border-2 border-[#2a2d40] rounded-sm overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <PartSelector parts={CARD_PARTS} selectedPart={selectedPart} onSelectPart={setSelectedPart} />
          </div>
        </div>

        <div className="flex justify-center items-start">
          <CardPreview card={card} />
        </div>

        <div>
          <div className="bg-[#1a1d2e] border-2 border-[#2a2d40] rounded-sm overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <PartEditor part={selectedPart} partSchema={CARD_PARTS[selectedPart]} card={card}
              onUpdateField={updateField} onUpdateFields={updateFields} />
          </div>

          <div className="mt-6 p-5 rounded-sm bg-amber-900/20 border-2 border-amber-700/50 text-center">
            <p className="text-lg font-bold text-amber-400" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
              🌊 Minting Coming Soon
            </p>
            <p className="text-sm text-amber-600 mt-2">
              On-chain card minting is under development. Design your card now — you'll be able to mint it when we launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
