import { useState } from 'react'
import MintCard from '@marketplace/components/MintCard'
import Portfolio from '@marketplace/components/Portfolio'

const noop = () => {}
type Tab = 'create' | 'portfolio'

export default function MintPage() {
  const [tab, setTab] = useState<Tab>('create')

  return (
    <div className="w-full" style={{ minHeight: '100vh', marginTop: 60 }}>
      {/* Tab Navigation */}
      <div className="flex gap-6 justify-center mb-2 py-3">
        {(['create', 'portfolio'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2
              ${tab === t
                ? 'text-[#1a1d2e] border-amber-500'
                : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
          >
            {t === 'create' ? '🎨 Create' : '📦 Portfolio'}
          </button>
        ))}
      </div>

      {/* Tab Content — full width, no constraints */}
      {tab === 'create' ? <MintCard onToast={noop} /> : <Portfolio onToast={noop} />}
    </div>
  )
}
