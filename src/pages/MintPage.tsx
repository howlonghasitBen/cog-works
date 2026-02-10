import { useState } from 'react'
import MintCard from '@marketplace/components/MintCard'
import Portfolio from '@marketplace/components/Portfolio'

const noop = () => {}
type Tab = 'create' | 'portfolio'

export default function MintPage() {
  const [tab, setTab] = useState<Tab>('create')

  return (
    <div className="w-full max-w-6xl mx-auto px-6 flex flex-col items-center justify-evenly" style={{ minHeight: '100vh', marginTop: 60 }}>
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b-2 border-[#2a2d40] w-full justify-center">
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
      <div className="w-full flex-1 flex items-center justify-center">
        {tab === 'create' ? <MintCard onToast={noop} /> : <Portfolio onToast={noop} />}
      </div>
    </div>
  )
}
