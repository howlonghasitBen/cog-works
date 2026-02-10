import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useAllCards } from '../../hooks/useCards'
import { formatWaves } from '../../lib/utils'
import Card from './Card'

interface PortfolioProps {
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void
}

export default function Portfolio({ onToast }: PortfolioProps) {
  const { address, isConnected } = useAccount()
  const { cards } = useAllCards()

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-5xl mb-4">🔗</p>
        <p className="text-lg">Connect your wallet to view portfolio</p>
      </div>
    )
  }

  const stakedCards = cards.filter(c => c.userShares > 0n)
  const ownedCards = cards.filter(c => address && c.owner.toLowerCase() === address.toLowerCase())
  const totalPending = cards.reduce((sum, c) => sum + c.pendingRewards, 0n)

  const stats = [
    { label: 'Staked Cards', value: stakedCards.length, icon: '🔒', color: '#22d3ee' },
    { label: 'Owned Cards', value: ownedCards.length, icon: '👑', color: '#f59e0b' },
    { label: 'Pending Rewards', value: formatWaves(totalPending) + ' WAVES', icon: '🎁', color: '#22C55E' },
  ]

  const portfolioCards = [...new Map([...stakedCards, ...ownedCards].map(c => [c.id, c])).values()]

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1a1d2e] border-2 border-[#2a2d40] rounded-sm p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {portfolioCards.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No staked or owned cards yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {portfolioCards.map(card => (
            <Card key={card.id} card={card} allCards={cards} onToast={onToast} />
          ))}
        </div>
      )}
    </div>
  )
}
