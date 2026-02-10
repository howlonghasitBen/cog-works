import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useWriteContract } from 'wagmi'
import { formatWaves, shortenAddress } from '../../lib/utils'
import { WHIRLPOOL_ADDRESS, WHIRLPOOL_ABI } from '../../lib/contracts'
import type { CardData } from '../../hooks/useCards'

const GRADIENTS = [
  'linear-gradient(135deg, #4a5568, #2d3748)',
  'linear-gradient(135deg, #2563eb, #1d4ed8)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #dc2626, #b91c1c)',
  'linear-gradient(135deg, #7c3aed, #6d28d9)',
  'linear-gradient(135deg, #0891b2, #0e7490)',
  'linear-gradient(135deg, #be185d, #9d174d)',
]

interface CardProps {
  card: CardData
  allCards: CardData[]
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void
}

export default function Card({ card, allCards, onToast = () => {} }: CardProps) {
  const { address } = useAccount()
  const { writeContract } = useWriteContract()
  const [showStats, setShowStats] = useState(false)
  const [swapPercent, setSwapPercent] = useState(100)
  const [fromCardId, setFromCardId] = useState<number | null>(null)

  const isOwner = address && card.owner.toLowerCase() === address.toLowerCase()
  const hasStake = card.userShares > 0n
  const gradient = GRADIENTS[(card.id - 1) % GRADIENTS.length]

  const handleSwap = () => {
    if (!fromCardId) { onToast('Select a source card', 'error'); return }
    const fromCard = allCards.find(c => c.id === fromCardId)
    if (!fromCard || fromCard.userShares === 0n) { onToast('No stake in source card', 'error'); return }
    const shares = (fromCard.userShares * BigInt(swapPercent)) / 100n
    if (shares === 0n) { onToast('Zero shares', 'error'); return }
    writeContract({
      address: WHIRLPOOL_ADDRESS,
      abi: WHIRLPOOL_ABI,
      functionName: 'swapStake',
      args: [BigInt(fromCardId), BigInt(card.id), shares],
    }, {
      onSuccess: () => onToast(`Swapped stake to ${card.name}!`, 'success'),
      onError: (e) => onToast(e.message.slice(0, 80), 'error'),
    })
  }

  const handleClaim = () => {
    writeContract({
      address: WHIRLPOOL_ADDRESS,
      abi: WHIRLPOOL_ABI,
      functionName: 'claimRewards',
      args: [BigInt(card.id)],
    }, {
      onSuccess: () => onToast(`Claimed rewards from ${card.name}!`, 'success'),
      onError: (e) => onToast(e.message.slice(0, 80), 'error'),
    })
  }

  const stakedCards = allCards.filter(c => c.userShares > 0n && c.id !== card.id)

  const pctBtn = (p: number) =>
    `flex-1 text-xs px-2 py-1 rounded-sm border-2 cursor-pointer transition-colors ${
      swapPercent === p
        ? 'bg-[#2a2d40] border-cyan-500/60 text-cyan-300'
        : 'bg-[#1a1d2e] border-[#2a2d40] text-gray-400 hover:text-white'
    }`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: card.id * 0.05 }}
      className="bg-[#1a1d2e] rounded-sm border-2 border-[#2a2d40] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-cyan-500/40 transition-colors"
    >
      <div
        className="relative flex items-center justify-center"
        style={{ aspectRatio: '1', background: gradient }}
      >
        <span className="text-6xl font-bold text-white/20 font-mono">#{card.id}</span>
        {isOwner && (
          <div className="absolute top-2 left-2 bg-amber-500 text-black px-2 py-0.5 rounded-sm text-xs font-bold">👑 Owner</div>
        )}
        {hasStake && (
          <div className="absolute top-2 right-2 bg-cyan-600 text-white px-2 py-0.5 rounded-sm text-xs font-bold">🔒 Staked</div>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-base font-semibold text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            {card.name || `Card #${card.id}`}
          </h3>
          <span className="text-xs text-gray-500 font-mono">{card.symbol}</span>
        </div>

        <div className="text-sm font-semibold text-cyan-400 font-mono">
          {formatWaves(card.price)} WAVES
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-1.5">
            {[25, 50, 100].map(p => (
              <button key={p} className={pctBtn(p)} onClick={() => setSwapPercent(p)}>{p}%</button>
            ))}
          </div>

          <select
            value={fromCardId ?? ''}
            onChange={e => setFromCardId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-8 text-xs rounded-sm bg-[#12141f] border-2 border-[#2a2d40] text-gray-300 px-2"
          >
            <option value="">Select source card...</option>
            {stakedCards.map(c => (
              <option key={c.id} value={c.id}>#{c.id} {c.name} ({formatWaves(c.userShares)} staked)</option>
            ))}
          </select>

          <button
            onClick={handleSwap}
            className="w-full text-sm py-1.5 rounded-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer border-none transition-colors"
          >
            ⚡ Swap Stake
          </button>
        </div>

        {card.pendingRewards > 0n && (
          <button
            onClick={handleClaim}
            className="mt-2 w-full py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition-colors bg-emerald-900/30 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-900/50"
          >
            🎁 Claim {formatWaves(card.pendingRewards)} WAVES
          </button>
        )}

        <button
          onClick={() => setShowStats(!showStats)}
          className="mt-2.5 w-full py-1.5 rounded-sm text-xs cursor-pointer transition-colors bg-transparent border-2 border-[#2a2d40] text-gray-500 hover:text-white flex justify-between items-center px-2"
        >
          <span>NFT Stats</span>
          <motion.span animate={{ rotate: showStats ? 180 : 0 }} transition={{ duration: 0.2 }}>▾</motion.span>
        </button>

        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="mt-2 p-2.5 bg-[#12141f] rounded-sm text-xs font-mono flex flex-col gap-1.5">
                {[
                  ['Owner', shortenAddress(card.owner)],
                  ['Reserves (WAVES)', formatWaves(card.reserves.waves)],
                  ['Reserves (Cards)', formatWaves(card.reserves.cards)],
                  ['Your Stake', formatWaves(card.userShares)],
                  ['Token', shortenAddress(card.tokenAddress)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
