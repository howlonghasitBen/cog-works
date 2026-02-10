import { useState, useCallback } from 'react'
import MintCard from '../components/marketplace/MintCard'
import Portfolio from '../components/marketplace/Portfolio'
import Toast from '../components/marketplace/Toast'

type Tab = 'create' | 'portfolio'

export default function MintPage() {
  const [tab, setTab] = useState<Tab>('create')
  const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', visible: false })

  const onToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, visible: true })
  }, [])

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'create', label: 'Create', icon: '✨' },
    { key: 'portfolio', label: 'Portfolio', icon: '💼' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8" style={{ marginTop: 60 }}>
      {/* Tab bar */}
      <nav className="flex gap-1 mb-8 border-b-2 border-[#2a2d40] pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold cursor-pointer transition-colors border-b-2 -mb-[2px] ${
              tab === t.key
                ? 'border-b-amber-500 text-amber-400 bg-[#1a1d2e]'
                : 'border-b-transparent text-gray-500 hover:text-white bg-transparent'
            }`}
            style={{ fontFamily: "'Inter Tight', sans-serif", borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {tab === 'create' && <MintCard onToast={onToast} />}
      {tab === 'portfolio' && <Portfolio onToast={onToast} />}

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  )
}
