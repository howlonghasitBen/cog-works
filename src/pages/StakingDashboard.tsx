/** Whirlpool Staking Dashboard */
import { useState, useMemo } from 'react'
import CogDonut from '../components/CogDonut'
import type { CogDonutSegment } from '../components/CogDonut'

// ─── Color palette ─────────────────────────────────────────────
const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']

// ─── Mock data ─────────────────────────────────────────────────
function addr() {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)]
  s += '...'
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)]
  return s
}

function mockStakers(n: number): CogDonutSegment[] {
  return Array.from({ length: n }, (_, i) => ({
    label: addr(),
    value: Math.floor(Math.random() * 9000) + 500,
    color: COLORS[i % COLORS.length],
  }))
}

const CARD_NAMES = [
  'Cosmic Surfer', 'Deep Reef', 'Tide Walker', 'Neon Drift',
  'Barrel Phantom', 'Kelp Forest', 'Riptide', 'Moon Swell',
  'Abyssal Glider', 'Coral Crown', 'Storm Chaser', 'Foam Dancer',
]

interface CardData {
  name: string
  stakers: CogDonutSegment[]
  total: number
}

const MOCK_CARDS: CardData[] = CARD_NAMES.map((name) => {
  const n = 3 + Math.floor(Math.random() * 5) // 3-7 stakers
  const stakers = mockStakers(n)
  return { name, stakers, total: stakers.reduce((s, st) => s + st.value, 0) }
})

type FilterMode = 'all' | 'my' | 'top' | 'risk'
type SortMode = 'name' | 'total' | 'depth'

export default function StakingDashboard() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sort, setSort] = useState<SortMode>('name')
  const [rippleKey, setRippleKey] = useState(0)

  const filtered = useMemo(() => {
    let cards = MOCK_CARDS.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )

    if (filter === 'top') {
      cards = [...cards].sort((a, b) => b.total - a.total).slice(0, 6)
    } else if (filter === 'risk') {
      // "risk" = cards where top staker owns > 50%
      cards = cards.filter((c) => {
        const max = Math.max(...c.stakers.map((s) => s.value))
        return max / c.total > 0.5
      })
    } else if (filter === 'my') {
      // Mock: show first 4
      cards = cards.slice(0, 4)
    }

    if (sort === 'name') cards = [...cards].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'total') cards = [...cards].sort((a, b) => b.total - a.total)
    else if (sort === 'depth') cards = [...cards].sort((a, b) => b.stakers.length - a.stakers.length)

    return cards
  }, [search, filter, sort])

  // Re-ripple on filter change
  const handleFilterChange = (f: FilterMode) => {
    setFilter(f)
    setRippleKey((k) => k + 1)
  }
  const handleSortChange = (s: SortMode) => {
    setSort(s)
    setRippleKey((k) => k + 1)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <h2
        className="text-4xl font-black text-white mb-2"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        Whirlpool Staking Dashboard
      </h2>
      <p className="text-gray-500 mb-8 font-mono text-sm">Token staker distribution across the pool</p>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-gray-300 px-4 py-2 rounded text-sm font-mono
                     placeholder-gray-600 focus:outline-none focus:border-amber-700 transition-colors w-56"
        />
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as FilterMode)}
          className="bg-gray-900 border border-gray-800 text-gray-300 px-4 py-2 rounded text-sm font-mono
                     focus:outline-none focus:border-amber-700 cursor-pointer"
        >
          <option value="all">All Cards</option>
          <option value="my">My Stakes</option>
          <option value="top">Top Holders</option>
          <option value="risk">Ownership Risk</option>
        </select>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortMode)}
          className="bg-gray-900 border border-gray-800 text-gray-300 px-4 py-2 rounded text-sm font-mono
                     focus:outline-none focus:border-amber-700 cursor-pointer"
        >
          <option value="name">By Name</option>
          <option value="total">By Total Staked</option>
          <option value="depth">By Pool Depth</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
        {filtered.map((card, i) => (
          <div key={card.name} className="flex flex-col items-center gap-3">
            <CogDonut
              title={card.name}
              total={card.total}
              segments={card.stakers}
              size={230}
              rippleDelay={i * 100}
              rippleKey={rippleKey}
              onSegmentClick={(seg) => console.log('Clicked', seg.label, 'on', card.name)}
            />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-600 font-mono mt-20">No cards match your filters.</p>
      )}
    </div>
  )
}
