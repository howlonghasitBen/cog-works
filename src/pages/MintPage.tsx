import { useState, useMemo } from 'react'
import { CARD_PARTS, createDefaultCard } from '@marketplace/components/editor/types'
import type { CardEditorData } from '@marketplace/components/editor/types'
import CogPartSelector from '../components/CogPartSelector'
import CogPartEditor from '../components/CogPartEditor'
import CardPreview from '@marketplace/components/editor/CardPreview'
import WhirlpoolTerminal from '../components/WhirlpoolTerminal'
import { useWhirlpool } from '../hooks/useWhirlpool'

function generateSymbol(name: string): string {
  if (!name.trim()) return '???'
  const words = name.trim().split(/\s+/)
  let sym = words.map(w => w[0]?.toUpperCase() || '').join('')
  if (sym.length < 2) sym = name.trim().toUpperCase().slice(0, 4)
  return sym.slice(0, 8)
}

function buildMetadata(card: CardEditorData): string {
  const meta = {
    name: card.name || 'Untitled Card',
    description: card.flavorText || 'A Whirlpool card',
    external_url: 'https://howlonghasitben.github.io/cog-works/',
    image: card.imageData || '',
    attributes: [
      { trait_type: 'Subtitle', value: card.subtitle || '' },
      { trait_type: 'Type', value: card.type },
      { trait_type: 'Level', display_type: 'number', value: card.level },
      { trait_type: 'Move Name', value: card.moveName || '' },
      { trait_type: 'Artist', value: card.artist || '' },
      { trait_type: 'Rarity', value: card.rarity },
      { trait_type: 'HP', display_type: 'number', value: card.stats.hp },
      { trait_type: 'Attack', display_type: 'number', value: card.stats.attack },
      { trait_type: 'Defense', display_type: 'number', value: card.stats.defense },
      { trait_type: 'Mana', display_type: 'number', value: card.stats.mana },
      { trait_type: 'Crit', display_type: 'number', value: card.stats.crit },
    ].filter(a => a.value !== '' && a.value !== 0),
  }
  const bytes = new TextEncoder().encode(JSON.stringify(meta))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return 'data:application/json;base64,' + btoa(binary)
}

export default function MintPage() {
  const [card, setCard] = useState<CardEditorData>(createDefaultCard())
  const [selectedPart, setSelectedPart] = useState<string>('identity')
  const [minting, setMinting] = useState(false)
  const whirlpool = useWhirlpool()

  const symbol = useMemo(() => generateSymbol(card.name), [card.name])
  const canMint = card.name.trim().length > 0 && whirlpool.isConnected && !minting

  const handleMint = async () => {
    if (!canMint) return
    setMinting(true)
    try {
      const uri = buildMetadata(card)
      await whirlpool.createCard(card.name.trim(), symbol, uri)
    } catch (e: any) {
      console.error('Mint failed:', e)
    }
    setMinting(false)
  }

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
          {/* Left — Part Selector + Terminal */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CogPartSelector
              parts={CARD_PARTS}
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
            />
            <div style={{
              height: 300,
              borderRadius: 4,
              border: '2px solid #3a3d4a',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <WhirlpoolTerminal logs={whirlpool.logs} onClear={whirlpool.clearLogs} />
            </div>
          </div>

          {/* Center — Live Preview */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <CardPreview card={card} />
          </div>

          {/* Right — Part Editor + Mint */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <CogPartEditor
              part={selectedPart}
              partSchema={CARD_PARTS[selectedPart]}
              card={card}
              onUpdateField={updateField}
              onUpdateFields={updateFields}
            />

            {/* Symbol preview */}
            {card.name.trim() && (
              <div style={{
                marginTop: 12,
                padding: '6px 12px',
                background: '#1a1d2e',
                border: '1px solid #3a3d4a',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4a4d5a', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Symbol
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: '#c8a55a' }}>
                  ${symbol}
                </span>
              </div>
            )}

            {/* Mint button */}
            <button
              onClick={handleMint}
              disabled={!canMint}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '14px 20px',
                background: canMint
                  ? 'linear-gradient(135deg, #c8a55a, #e8c56a)'
                  : 'linear-gradient(135deg, #2a2d3a, #1a1d2e)',
                border: `2px solid ${canMint ? '#c8a55a' : '#3a3d4a'}`,
                borderRadius: 2,
                color: canMint ? '#1a1d2e' : '#4a4d5a',
                fontFamily: "'Cinzel', serif",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: 2,
                cursor: canMint ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: canMint ? '0 4px 20px rgba(200,165,90,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {!whirlpool.isConnected ? (
                '🔗 CONNECT WALLET'
              ) : minting ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
                  FORGING...
                </>
              ) : (
                <>⚒️ FORGE CARD</>
              )}
            </button>

            {/* Mint fee */}
            <p style={{
              marginTop: 8,
              textAlign: 'center',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#4a4d5a',
            }}>
              Mint Fee: <span style={{ color: '#c8a55a', fontWeight: 700 }}>0.05 ETH</span>
            </p>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
  )
}
