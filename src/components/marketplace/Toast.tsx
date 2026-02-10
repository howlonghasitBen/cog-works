import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
  onClose: () => void
}

export default function Toast({ message, type = 'info', visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 4000)
      return () => clearTimeout(t)
    }
  }, [visible, onClose])

  const colors = {
    success: { bg: '#1a2e1a', border: '#22C55E' },
    error: { bg: '#2e1a1a', border: '#ef4444' },
    info: { bg: '#1a1d2e', border: '#60a5fa' },
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            padding: '12px 20px',
            borderRadius: '2px',
            background: colors[type].bg,
            border: `2px solid ${colors[type].border}`,
            fontSize: '14px',
            maxWidth: '360px',
            cursor: 'pointer',
            color: '#e5e7eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: "'Inter Tight', sans-serif",
          }}
          onClick={onClose}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
