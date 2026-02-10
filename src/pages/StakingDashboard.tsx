import { useState, useMemo } from 'react'
import CogDonut from '../components/CogDonut'

const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']

function mockAddr() {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)]
  s += '...'
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)]
  return s
}

function mockStakers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    label: mockAddr(),
    value: Math.floor(Math.random() * 50000) + 5000,
    color: COLORS[i % COLORS.length],
  }))
}

const MOCK_CARDS = [
  'Cosmic Surfer', 'Deep Reef', 'Tide Walker', 'Barrel Rider',
  'Moon Jelly', 'Coral King', 'Wave Phantom', 'Drift Lord',
  'Storm Chaser', 'Kelp Sage', 'Sand Serpent', 'Foam Spirit',
].map(name => {
  const stakers = mockStakers(Math.floor(Math.random() * 5) + 3)
  return { name, stakers, total: stakers.reduce((s, x) => s + x.value, 0) }
})

type SortKey = 'name' | 'total'
type FilterKey = 'all' | 'myStakes' | 'topHolders' | 'risk'

export default function StakingDashboard() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('name')

  const cards = useMemo(() => {
    let result = MOCK_CARDS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    else result.sort((a, b) => b.total - a.total)
    return result
  }, [search, sort, filter])

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 bg-[#1a1d2e] rounded border-2 border-[#2a2d40] shadow-[0_4px_20px_rgba(0,0,0,0.3)] my-8" style={{ marginTop: 60 }}>
      <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        Whirlpool Staking Dashboard
      </h2>
      <p className="text-gray-500 text-sm mb-8 font-mono">Card token distribution by staker</p>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 mb-10 items-center">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-white px-4 py-2 text-sm font-mono focus:border-amber-600 focus:outline-none w-64"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as FilterKey)}
          className="bg-gray-900 border border-gray-800 text-gray-400 px-4 py-2 text-sm font-mono focus:border-amber-600 focus:outline-none"
        >
          <option value="all">All Cards</option>
          <option value="myStakes">My Stakes</option>
          <option value="topHolders">Top Holders</option>
          <option value="risk">Ownership Risk</option>
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="bg-gray-900 border border-gray-800 text-gray-400 px-4 py-2 text-sm font-mono focus:border-amber-600 focus:outline-none"
        >
          <option value="name">By Name</option>
          <option value="total">By Total Staked</option>
        </select>
      </div>

      {/* Donut grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
        {cards.map((card, i) => (
          <CogDonut
            key={card.name}
            title={card.name}
            total={card.total}
            segments={card.stakers}
            delay={i * 100}
          />
        ))}
      </div>

      {cards.length === 0 && (
        <p className="text-gray-600 text-center py-20 font-mono">No cards match your search.</p>
      )}
    </div>
  )
}
