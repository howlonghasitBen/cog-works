/** SwapPage — Whirlpool swapStake Interface
 *
 * Redesigned to match StakingDashboard visual philosophy:
 * - All inline styles (no Tailwind)
 * - Gold steampunk theme (#c8a55a, #8a6d2b)
 * - Stats header bar
 * - Card grids for inventory and market
 * - Compact center swap panel
 * - Cinzel + DM Mono fonts
 * - Framer Motion animations
 */

import { useState, useMemo } from 'react'
import { useToast } from '../components/Toast'
import { useWhirlpool } from '../hooks/useWhirlpool'
import { useCardData } from '../hooks/useCardData'
import CardFromData from '../components/CardFromData'
// CardState type removed — no longer needed without modal

// ─── Types ──────────────────────────────────────────────────────
interface CardPool {
  id: number
  name: string
  number: number
  image: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  type: string
  owner: string
  ownerShares: number
  totalStaked: number
  priceWaves: number
  topStakers: { address: string; shares: number; percentage: number }[]
  stealAmount: number
  userShares?: number
  userPercentage?: number
  isOwner?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────
const BASE = '/images/card-images'
const TAGS = ['Creature', 'Consumable', 'Eagle', 'Beast', 'OG', 'Legendary', 'Forest', 'Memer']

function cardImage(uri: string, name: string, id: number): string {
  if (uri && uri.startsWith('data:application/json;base64,')) {
    try {
      const json = JSON.parse(atob(uri.split(',')[1]))
      if (json.image) return json.image
    } catch { /* fall through */ }
  }
  if (uri && uri.startsWith('/images/')) return uri
  if (uri && uri.startsWith('ipfs://')) return uri
  const slug = name.replace(/\s+/g, '_')
  return `${BASE}/${String(id + 1).padStart(3, '0')}_${slug}.png`
}

// Activity feed for hover overlay
interface ActivityEntry {
  type: 'stake' | 'unstake' | 'swap' | 'ownership'
  actor: string
  amount: string
  time: string
}

const MOCK_ACTIVITY: ActivityEntry[] = [
  { type: 'stake', actor: '0x93709D…250Ea', amount: '120.00', time: '2m ago' },
  { type: 'swap', actor: '0xd8dA6B…045d', amount: '45.50', time: '8m ago' },
  { type: 'unstake', actor: '0xAb5801…8aB6', amount: '30.00', time: '22m ago' },
  { type: 'ownership', actor: '0x93709D…250Ea', amount: '—', time: '1h ago' },
  { type: 'stake', actor: '0x1234AB…9def', amount: '200.00', time: '3h ago' },
]

const ACTIVITY_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  stake:     { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'STAKE' },
  unstake:   { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: 'UNSTAKE' },
  swap:      { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'SWAP' },
  ownership: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'OWNER' },
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || '???'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function priceToRarity(price: number): 'Common' | 'Rare' | 'Epic' | 'Legendary' {
  if (price >= 1) return 'Legendary'
  if (price >= 0.3) return 'Epic'
  if (price >= 0.1) return 'Rare'
  return 'Common'
}

// ─── Main SwapPage ──────────────────────────────────────────────
export default function SwapPage() {
  const whirlpool = useWhirlpool()
  const { cards: allCardData } = useCardData()
  const toast = useToast()
  const [inventorySearch, setInventorySearch] = useState('')
  const [marketSearch, setMarketSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [targetId, setTargetId] = useState<number | null>(null)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [hoveredMarketCard, setHoveredMarketCard] = useState<string | null>(null)

  // Build on-chain lookup by name
  const onChainByName = useMemo(() => {
    const map = new Map<string, typeof whirlpool.cards[0]>()
    whirlpool.cards.forEach(c => map.set(c.name.toLowerCase(), c))
    return map
  }, [whirlpool.cards])

  // Map cardData.json → CardPool, overlay on-chain data
  const allPools: CardPool[] = useMemo(() => allCardData.map((cd, idx) => {
    const chain = onChainByName.get(cd.name.toLowerCase())
    const price = chain ? (parseFloat(chain.price) || 0) : 0
    const totalStaked = chain ? (parseFloat(chain.cardReserve) || 0) : 0
    const ownerShares = totalStaked
    const owner = chain?.owner || ''
    return {
      id: chain?.id ?? idx,
      name: cd.name,
      number: (chain?.id ?? idx) + 1,
      image: cd.image || '',
      rarity: priceToRarity(price),
      type: chain?.symbol || cd.type || '',
      owner: owner ? shortAddr(owner) : '—',
      ownerShares,
      totalStaked,
      priceWaves: price,
      topStakers: owner ? [{ address: shortAddr(owner), shares: ownerShares, percentage: 100 }] : [],
      stealAmount: Math.max(0, ownerShares * 0.51),
    }
  }), [allCardData, onChainByName])

  const myCards: CardPool[] = useMemo(() => allPools.filter(pool => {
    const chain = onChainByName.get(pool.name.toLowerCase())
    return chain && (parseFloat(chain.myBalance) > 0 || parseFloat(chain.myStake) > 0)
  }).map(pool => {
    const chain = onChainByName.get(pool.name.toLowerCase())!
    const myStake = parseFloat(chain.myStake) || 0
    const myBalance = parseFloat(chain.myBalance) || 0
    return {
      ...pool,
      userShares: myStake + myBalance,
      userPercentage: pool.totalStaked > 0 ? Math.round((myStake / pool.totalStaked) * 100) : 0,
      isOwner: chain.owner.toLowerCase() === whirlpool.address?.toLowerCase(),
    }
  }), [allPools, onChainByName, whirlpool.address])

  const selectedCards = myCards.filter(c => selectedIds.has(c.id))
  const targetPool = allPools.find(p => p.id === targetId) || null

  const totalValue = useMemo(() => {
    return myCards.reduce((sum, c) => sum + (c.userShares || 0) * c.priceWaves, 0)
  }, [myCards])

  const filteredInventory = useMemo(() => {
    if (!inventorySearch) return myCards
    const q = inventorySearch.toLowerCase()
    return myCards.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
  }, [inventorySearch, myCards])

  const filteredMarket = useMemo(() => {
    let cards = allPools
    if (marketSearch) {
      const q = marketSearch.toLowerCase()
      cards = cards.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
    }
    if (activeTags.size > 0) {
      cards = cards.filter(c => {
        const cardTags = [c.rarity, c.type.split(' ')[0], c.name.split(' ')[0]]
        return cardTags.some(t => activeTags.has(t))
      })
    }
    return cards
  }, [marketSearch, activeTags, allPools])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const removeSelected = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const canSwap = selectedIds.size > 0 && targetId !== null && !selectedIds.has(targetId)

  const swapEstimate = useMemo(() => {
    if (selectedCards.length === 0 || !targetPool) return null
    const totalWavesOut = selectedCards.reduce((sum, p) => sum + (p.userShares || 0) * p.priceWaves, 0)
    const tokensOut = targetPool.priceWaves > 0 ? totalWavesOut / targetPool.priceWaves : 0
    const wouldSteal = tokensOut > targetPool.ownerShares
    return { wavesOut: totalWavesOut, tokensOut, wouldSteal, sourceCount: selectedCards.length }
  }, [selectedCards, targetPool])

  const handleSwap = async () => {
    if (!canSwap || targetId === null) return
    try {
      for (const card of selectedCards) {
        const c = whirlpool.cards.find(cc => cc.id === card.id)
        if (c && parseFloat(c.myStake) > 0) {
          await whirlpool.swapStake(card.id, targetId, c.myStake)
        }
      }
      toast.success('Swap complete!')
      setSelectedIds(new Set())
      setTargetId(null)
    } catch (err: any) { 
      toast.error(err?.shortMessage || err?.message || 'Swap failed') 
    }
  }

  const handleBuyWaves = () => {
    alert('Wrap ETH first (Mint page), then swap WETH → WAVES on SurfSwap')
  }

  return (
    <div style={{ width: '100%', margin: '60px 0 32px', padding: '0 24px', position: 'relative', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 32,
            fontWeight: 900,
            color: '#8a6d2b',
            margin: 0,
            letterSpacing: 1,
          }}>
            Whirlpool Swap
          </h2>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            color: '#4a4d5a',
            margin: '2px 0 0',
          }}>
            Trade positions · Steal ownership · Build dominance
          </p>
        </div>
      </div>

      {/* ── Thin gold separator ── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, #c8a55a, transparent 80%)', marginBottom: 24 }} />

      {/* ── Stats: floating chips ── */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Your Positions', value: myCards.length.toString(), accent: false },
          { label: 'Total Value', value: `${totalValue.toFixed(4)} WAVES`, accent: true },
          { label: 'Wallet', value: whirlpool.isConnected ? shortAddr(whirlpool.address || '') : 'Not Connected', accent: false },
        ].map(stat => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#4a4d5a',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {stat.label}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 20,
              color: stat.accent ? '#8a6d2b' : '#2a2d3a',
              fontWeight: 700,
            }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Main Layout: 3 columns ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: 16,
        alignItems: 'stretch',
        maxWidth: '100vw',
        overflow: 'hidden',
      }}>

        {/* ─── LEFT: My Inventory ─── */}
        <div style={{
          background: 'linear-gradient(180deg, #2a2d3a, #1a1d2e, #22252f)',
          border: '1px solid rgba(200,165,90,0.2)',
          borderRadius: 4,
          padding: 20,
          maxHeight: 'calc(100vh - 280px)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
            color: '#c8a55a',
            margin: '0 0 16px',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            My Inventory
          </h3>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={inventorySearch}
            onChange={e => setInventorySearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #3a3d4a',
              color: '#d0d0d0',
              padding: '4px 0',
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              outline: 'none',
              marginBottom: 16,
            }}
            onFocus={e => { e.target.style.borderBottomColor = '#c8a55a' }}
            onBlur={e => { e.target.style.borderBottomColor = '#3a3d4a' }}
          />

          {/* Card Grid — simple 2-col, min 300px */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 12,
            paddingRight: 8,
          }}>
            {filteredInventory.length === 0 ? (
              <p style={{
                fontFamily: "'DM Mono', monospace",
                color: '#4a4d5a',
                fontSize: 11,
                textAlign: 'center',
                padding: '40px 0',
                gridColumn: '1 / -1',
              }}>
                {whirlpool.isConnected ? 'No cards in inventory' : 'Connect wallet'}
              </p>
            ) : (
              filteredInventory.map((card) => {
                const selected = selectedIds.has(card.id)
                return (
                  <div
                    key={card.name}
                    onClick={() => toggleSelect(card.id)}
                    style={{
                      cursor: 'pointer',
                      border: selected ? '2px solid #c8a55a' : '2px solid transparent',
                      borderRadius: 4,
                      boxShadow: selected ? '0 0 15px rgba(200,165,90,0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <CardFromData name={card.name} width={300} />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ─── CENTER: Swap Stage ─── */}
        <div style={{
          background: 'linear-gradient(180deg, #2a2d3a, #1a1d2e, #22252f)',
          border: '1px solid rgba(200,165,90,0.2)',
          borderRadius: 4,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <h3 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
            color: '#c8a55a',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
          }}>
            Swap Stage
          </h3>

          {/* Selected source cards as pills */}
          <div style={{
            width: '100%',
            minHeight: 80,
            background: 'rgba(26,29,46,0.5)',
            border: '1px solid rgba(58,61,74,0.4)',
            borderRadius: 3,
            padding: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignContent: 'flex-start',
          }}>
            {selectedCards.length === 0 ? (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#4a4d5a',
                width: '100%',
                textAlign: 'center',
                padding: '24px 0',
              }}>
                ← Select from inventory
              </span>
            ) : (
              selectedCards.map(card => (
                <div key={card.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(200,165,90,0.1)',
                  border: '1px solid rgba(200,165,90,0.3)',
                  borderRadius: 12,
                  padding: '4px 8px 4px 10px',
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: '#c8a55a',
                    fontWeight: 600,
                  }}>
                    {card.name}
                  </span>
                  <button
                    onClick={() => removeSelected(card.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8a6d2b',
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >✕</button>
                </div>
              ))
            )}
          </div>

          {/* Gold divider */}
          <div style={{
            width: 80,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #c8a55a, transparent)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 16,
              color: '#c8a55a',
            }}>→</div>
          </div>

          {/* Target card */}
          <div style={{
            width: 240,
            aspectRatio: '3/4',
            overflow: 'hidden',
            border: targetPool ? '2px solid rgba(200,165,90,0.5)' : '1px dashed rgba(58,61,74,0.5)',
            borderRadius: 4,
            background: 'rgba(26,29,46,0.5)',
            position: 'relative',
          }}>
            {targetPool ? (
              <>
                <CardFromData name={targetPool.name} width={240} />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '20px 8px 8px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#f0e6d0',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}>
                    {targetPool.name}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 8,
                    color: '#d1c4a0',
                    marginTop: 2,
                  }}>
                    {targetPool.rarity} · {targetPool.priceWaves.toFixed(4)} WAVES
                  </div>
                </div>
                <button
                  onClick={() => setTargetId(null)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 20,
                    height: 20,
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >✕</button>
              </>
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: '#4a4d5a',
                }}>
                  Browse market →
                </span>
              </div>
            )}
          </div>

          {/* Swap estimate */}
          {swapEstimate && (
            <div style={{
              width: '100%',
              background: 'rgba(26,29,46,0.5)',
              border: '1px solid rgba(58,61,74,0.4)',
              borderRadius: 3,
              padding: 12,
            }}>
              {swapEstimate.sourceCount > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280' }}>
                    Positions merged
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c8a55a', fontWeight: 600 }}>
                    {swapEstimate.sourceCount}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280' }}>
                  WAVES out
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c8a55a', fontWeight: 600 }}>
                  {swapEstimate.wavesOut.toFixed(4)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280' }}>
                  Tokens acquired
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#10b981', fontWeight: 600 }}>
                  {swapEstimate.tokensOut.toFixed(4)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280' }}>
                  Takes ownership?
                </span>
                <span style={{ 
                  fontFamily: "'DM Mono', monospace", 
                  fontSize: 10, 
                  color: swapEstimate.wouldSteal ? '#f59e0b' : '#6b7280',
                  fontWeight: swapEstimate.wouldSteal ? 700 : 400,
                }}>
                  {swapEstimate.wouldSteal ? '⚡ YES' : 'No'}
                </span>
              </div>
            </div>
          )}

          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: '#6b7280',
            textAlign: 'center',
            margin: 0,
          }}>
            Est. Gas: <span style={{ color: '#c8a55a' }}>~181k gas (~0.002 ETH)</span>
          </p>

          {/* Swap button */}
          <button
            disabled={!canSwap}
            onClick={handleSwap}
            style={{
              width: '100%',
              padding: '14px 0',
              fontFamily: "'Cinzel', serif",
              fontSize: 13,
              fontWeight: 700,
              color: canSwap ? '#1a1d2e' : '#4a4d5a',
              background: canSwap 
                ? (swapEstimate?.wouldSteal 
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                  : 'linear-gradient(135deg, #c8a55a, #e8c56a)')
                : '#2a2d3a',
              border: canSwap ? 'none' : '1px solid rgba(58,61,74,0.4)',
              borderRadius: 2,
              cursor: canSwap ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
              letterSpacing: 1,
              boxShadow: canSwap ? '0 4px 16px rgba(200,165,90,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (canSwap) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,165,90,0.4)'
              }
            }}
            onMouseLeave={e => {
              if (canSwap) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(200,165,90,0.3)'
              }
            }}
          >
            {canSwap
              ? (swapEstimate?.wouldSteal ? '⚡ SWAP TO STEAL' : 'INITIATE SWAP')
              : 'SELECT CARDS'}
          </button>

          {/* Buy WAVES button */}
          <button
            onClick={handleBuyWaves}
            style={{
              width: '100%',
              padding: '10px 0',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              color: '#c8a55a',
              background: 'transparent',
              border: '1px solid rgba(200,165,90,0.3)',
              borderRadius: 2,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(200,165,90,0.6)'
              e.currentTarget.style.background = 'rgba(200,165,90,0.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(200,165,90,0.3)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Buy $WAVES
          </button>
        </div>

        {/* ─── RIGHT: Market Search ─── */}
        <div style={{
          background: 'linear-gradient(180deg, #2a2d3a, #1a1d2e, #22252f)',
          border: '1px solid rgba(200,165,90,0.2)',
          borderRadius: 4,
          padding: 20,
          maxHeight: 'calc(100vh - 280px)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 14,
              color: '#c8a55a',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Market Browse
            </h3>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#4a4d5a',
            }}>
              ({allPools.length})
            </span>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={marketSearch}
            onChange={e => setMarketSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #3a3d4a',
              color: '#d0d0d0',
              padding: '4px 0',
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              outline: 'none',
              marginBottom: 12,
            }}
            onFocus={e => { e.target.style.borderBottomColor = '#c8a55a' }}
            onBlur={e => { e.target.style.borderBottomColor = '#3a3d4a' }}
          />

          {/* Tag filter chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {TAGS.map(tag => {
              const active = activeTags.has(tag)
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTags(prev => {
                      const n = new Set(prev)
                      if (n.has(tag)) n.delete(tag); else n.add(tag)
                      return n
                    })
                  }}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    padding: '3px 10px',
                    border: 'none',
                    borderRadius: 10,
                    background: active ? 'rgba(200,165,90,0.2)' : 'transparent',
                    color: active ? '#c8a55a' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.color = '#9ca3af'
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>

          {/* Card grid — simple 2-col with min 250px */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 12,
            paddingRight: 8,
          }}>
            {filteredMarket.length === 0 ? (
              <p style={{
                fontFamily: "'DM Mono', monospace",
                color: '#4a4d5a',
                fontSize: 11,
                textAlign: 'center',
                padding: '40px 0',
                gridColumn: '1 / -1',
              }}>
                {allCardData.length === 0 ? 'Loading cards...' : 'No cards match'}
              </p>
            ) : (
              filteredMarket.map((card) => {
                const isTarget = targetId === card.id
                const isHovered = hoveredMarketCard === card.name
                return (
                  <div
                    key={card.name}
                    onClick={() => setTargetId(isTarget ? null : card.id)}
                    onMouseEnter={() => setHoveredMarketCard(card.name)}
                    onMouseLeave={() => setHoveredMarketCard(null)}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      border: isTarget ? '2px solid #c8a55a' : '2px solid transparent',
                      borderRadius: 4,
                      boxShadow: isTarget ? '0 0 15px rgba(200,165,90,0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <CardFromData name={card.name} width={250} />

                    {/* Activity hover overlay */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(10,12,20,0.92)',
                        borderRadius: 4,
                        padding: '12px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        overflow: 'hidden',
                        zIndex: 2,
                      }}>
                        <div style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#c8a55a',
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}>
                          Recent Activity
                        </div>
                        {MOCK_ACTIVITY.map((entry, i) => {
                          const badge = ACTIVITY_BADGE[entry.type]
                          return (
                            <div key={i} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 6px',
                              background: 'rgba(255,255,255,0.03)',
                              borderRadius: 3,
                              border: '1px solid rgba(58,61,74,0.3)',
                            }}>
                              <span style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 7,
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: 2,
                                background: badge.bg,
                                color: badge.color,
                                letterSpacing: 0.5,
                                flexShrink: 0,
                              }}>
                                {badge.label}
                              </span>
                              <span style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 8,
                                color: '#d0d0d0',
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {entry.actor}
                              </span>
                              {entry.amount !== '—' && (
                                <span style={{
                                  fontFamily: "'DM Mono', monospace",
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: entry.type === 'unstake' ? '#ef4444' : '#10b981',
                                  flexShrink: 0,
                                }}>
                                  {entry.type === 'unstake' ? '-' : '+'}{entry.amount}
                                </span>
                              )}
                              <span style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 7,
                                color: '#4a4d5a',
                                flexShrink: 0,
                              }}>
                                {entry.time}
                              </span>
                            </div>
                          )
                        })}
                        {isTarget && (
                          <div style={{
                            marginTop: 'auto',
                            textAlign: 'center',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 8,
                            fontWeight: 700,
                            color: '#c8a55a',
                            padding: '4px 0',
                          }}>
                            ✓ SELECTED AS TARGET
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
