import { useState, useMemo } from 'react'
import { CARD_PARTS, createDefaultCard } from '@marketplace/components/editor/types'
import type { CardEditorData } from '@marketplace/components/editor/types'
import CogPartSelector from '../components/CogPartSelector'
import CogPartEditor from '../components/CogPartEditor'
import CardPreview from '@marketplace/components/editor/CardPreview'
import CardFromData, { buildFallbackCard } from '../components/CardFromData'
import WhirlpoolTerminal from '../components/WhirlpoolTerminal'
import { useWhirlpool } from '../hooks/useWhirlpool'
import { invalidateCardData } from '../hooks/useCardData'

function generateSymbol(name: string): string {
  if (!name.trim()) return '???'
  const words = name.trim().split(/\s+/)
  let sym = words.map(w => w[0]?.toUpperCase() || '').join('')
  if (sym.length < 2) sym = name.trim().toUpperCase().slice(0, 4)
  return sym.slice(0, 8)
}

const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzNjY2Y2I3MC0wYzliLTRlMTItYmE3ZS1hYTc2NmNiYjk5ZTkiLCJlbWFpbCI6Imhvd2xvbmdoYXNpdGJlbkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiOWJlOTUzMzA0NTc5NGU5YTBiNmYiLCJzY29wZWRLZXlTZWNyZXQiOiI0MzUxMzdlNWQ5MGIyMzQyMTc2YWRmMzAxYTQwZGNiMjA5Y2RhOWVlYTYyZTMyNTZjN2UxZTczMmViYWJiYThmIiwiZXhwIjoxODAxNDc0ODY0fQ.MJ7MZzOPgRxFSS9wOsZLnPaNNuXk385zXFhmJpcP5z0'

async function uploadMetadataToIPFS(card: CardEditorData): Promise<string> {
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
  const blob = new Blob([JSON.stringify(meta)], { type: 'application/json' })
  const form = new FormData()
  form.append('file', blob, `${(card.name || 'card').replace(/\s+/g, '_')}.json`)
  form.append('pinataMetadata', JSON.stringify({ name: `whirlpool-${card.name}` }))
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  })
  if (!res.ok) throw new Error(`IPFS upload failed: ${res.status}`)
  const data = await res.json()
  return `ipfs://${data.IpfsHash}`
}

export default function MintPage() {
  const [card, setCard] = useState<CardEditorData>(createDefaultCard())
  const [selectedPart, setSelectedPart] = useState<string>('identity')
  const [minting, setMinting] = useState(false)
  const whirlpool = useWhirlpool()

  const symbol = useMemo(() => generateSymbol(card.name), [card.name])
  const canMint = card.name.trim().length > 0 && whirlpool.isConnected && !minting

  const handleMint = async () => {
    if (minting) return
    if (!whirlpool.isConnected) {
      whirlpool.connect()
      return
    }
    if (!card.name.trim()) return
    setMinting(true)
    try {
      // Save card data + metadata file locally (adds to cardData.json + metadata dir)
      const saveRes = await fetch('/api/mint-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      })
      const saveData = await saveRes.json()
      if (!saveData.ok) throw new Error(saveData.error || 'Failed to save card data')

      // Use the local metadata URI as the tokenURI on-chain
      const uri = saveData.uri
      await whirlpool.createCard(card.name.trim(), symbol, uri, card)
      // Refresh cardData.json cache so staking/swap pages pick up the new card
      invalidateCardData()
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
    <>
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

      {/* Mint Success Modal */}
      {whirlpool.lastCreatedCard && (
        <div
          onClick={() => whirlpool.clearLastCreated()}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${Math.random() * 40}%`,
              left: `${Math.random() * 100}%`,
              width: 8, height: 8,
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              background: ['#c8a55a', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 7],
              animation: `confettiFall ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.8}s forwards`,
              opacity: 0.9,
            }} />
          ))}
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(135deg, #1a1d2e, #22252f)',
            border: '2px solid #c8a55a',
            borderRadius: 12,
            padding: '32px 40px',
            maxWidth: 480, width: '90vw',
            textAlign: 'center',
            animation: 'fadeSlideUp 0.4s ease-out',
            boxShadow: '0 0 60px rgba(200,165,90,0.2), 0 8px 40px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{
              fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 900,
              color: '#c8a55a', margin: '0 0 8px',
            }}>Card Created!</h2>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: 14,
              color: '#d0d0d0', margin: '0 0 20px',
            }}>
              <span style={{ color: '#c8a55a', fontWeight: 700 }}>{whirlpool.lastCreatedCard.name}</span> ({whirlpool.lastCreatedCard.symbol}) has entered the Whirlpool
            </p>
            {/* Card Preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 220, animation: 'fadeSlideUp 0.4s ease-out 0.15s both' }}>
                <CardFromData
                  name={whirlpool.lastCreatedCard.name}
                  width={220}
                  fallbackData={buildFallbackCard(whirlpool.lastCreatedCard.name, whirlpool.lastCreatedCard.symbol, whirlpool.lastCreatedCard.editorData)}
                />
              </div>
            </div>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              color: '#888', margin: '0 0 16px', wordBreak: 'break-all',
            }}>
              tx: {whirlpool.lastCreatedCard.hash.slice(0, 20)}...
            </p>
            <button onClick={() => whirlpool.clearLastCreated()} style={{
              fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700,
              color: '#1a1d2e', background: 'linear-gradient(135deg, #c8a55a, #e8c96a)',
              border: 'none', borderRadius: 8, padding: '10px 32px', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(200,165,90,0.3)',
            }}>Continue</button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.9; } 100% { transform: translateY(60vh) rotate(720deg); opacity: 0; } }
        @keyframes fadeSlideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  )
}
