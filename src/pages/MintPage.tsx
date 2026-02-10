import { useState } from 'react'
import MintCard from '../components/marketplace/MintCard'
import Portfolio from '../components/marketplace/Portfolio'

type Tab = 'create' | 'portfolio'

export default function MintPage() {
  const [tab, setTab] = useState<Tab>('create')

  return (
    <div className="w-full max-w-6xl mx-auto px-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b-2 border-[#2a2d40]">
        {(['create', 'portfolio'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors
              ${tab === t
                ? 'text-white border-b-2 border-cyan-400 -mb-[2px]'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            {t === 'create' ? '🎨 Create' : '📦 Portfolio'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'create' ? <MintCard /> : <Portfolio />}
    </div>
  )
}
