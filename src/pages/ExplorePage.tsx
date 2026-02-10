import { useState, useCallback } from 'react'
import Marketplace from '../components/marketplace/Marketplace'
import Toast from '../components/marketplace/Toast'

export default function ExplorePage() {
  const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', visible: false })

  const onToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, visible: true })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8" style={{ marginTop: 60 }}>
      <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        Explore Marketplace
      </h1>
      <p className="text-sm text-gray-500 mb-8">Browse and trade Whirlpool cards.</p>

      <Marketplace onToast={onToast} />

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  )
}
