import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useAllCards } from '../../hooks/useCards'
import Card from './Card'
import Sidebar from './Sidebar'

interface MarketplaceProps {
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void
}

export default function Marketplace({ onToast }: MarketplaceProps) {
  const { address } = useAccount()
  const { cards, totalCards, isLoading } = useAllCards()
  const [sortBy, setSortBy] = useState('id')
  const [filterStaked, setFilterStaked] = useState(false)
  const [filterOwned, setFilterOwned] = useState(false)

  const filtered = useMemo(() => {
    let result = [...cards]
    if (filterStaked) result = result.filter(c => c.userShares > 0n)
    if (filterOwned && address) result = result.filter(c => c.owner.toLowerCase() === address.toLowerCase())
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => Number(a.price - b.price)); break
      case 'price-desc': result.sort((a, b) => Number(b.price - a.price)); break
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break
      default: result.sort((a, b) => a.id - b.id)
    }
    return result
  }, [cards, sortBy, filterStaked, filterOwned, address])

  const filterBtn = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-sm border-2 cursor-pointer transition-colors ${
      active ? 'bg-[#2a2d40] border-cyan-500/60 text-cyan-300' : 'bg-[#1a1d2e] border-[#2a2d40] text-gray-400 hover:text-white'
    }`

  return (
    <div className="flex flex-row gap-6 w-full">
      <div className="hidden lg:block">
        <Sidebar
          sortBy={sortBy} setSortBy={setSortBy}
          filterStaked={filterStaked} setFilterStaked={setFilterStaked}
          filterOwned={filterOwned} setFilterOwned={setFilterOwned}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden mb-4 flex gap-2 flex-wrap">
          <button className={filterBtn(filterStaked)} onClick={() => setFilterStaked(!filterStaked)}>🔒 Staked</button>
          <button className={filterBtn(filterOwned)} onClick={() => setFilterOwned(!filterOwned)}>👤 Owned</button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-xs h-8 rounded-sm bg-[#12141f] border-2 border-[#2a2d40] text-gray-300 px-2"
          >
            <option value="id"># ID</option>
            <option value="price-asc">↑ Price</option>
            <option value="price-desc">↓ Price</option>
            <option value="name">A-Z</option>
          </select>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${filtered.length} of ${totalCards} cards`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-3 border-[#2a2d40] border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-5xl mb-3">🌊</p>
            <p>No cards found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(card => (
              <Card key={card.id} card={card} allCards={cards} onToast={onToast || (() => {})} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
