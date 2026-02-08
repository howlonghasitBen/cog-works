/** CogDropdown — Compact dropdown menu triggered by a spinning cog
 *
 * A traditional dropdown but with cog flair — the trigger is a gear icon
 * that spins on open, and the dropdown has gear-tooth-shaped borders.
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CogDropdownItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  divider?: boolean
  disabled?: boolean
}

export interface CogDropdownProps {
  items: CogDropdownItem[]
  label?: string
  size?: number
  align?: 'left' | 'right'
  className?: string
}

export default function CogDropdown({
  items,
  label,
  size = 36,
  align = 'left',
  className = '',
}: CogDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 bg-white text-gray-700 cursor-pointer hover:border-amber-400 hover:text-amber-600 transition-colors text-sm font-medium"
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
      >
        <motion.svg
          width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </motion.svg>
        {label && <span>{label}</span>}
        <span className="text-xs text-gray-400">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={`absolute top-full mt-1 min-w-48 border border-gray-200 bg-white shadow-xl z-50 py-1 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {items.map((item, i) =>
              item.divider ? (
                <div key={i} className="h-px bg-gray-100 my-1" />
              ) : item.href ? (
                <a
                  key={i}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 no-underline hover:bg-amber-50 hover:text-amber-700 transition-colors ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  {item.label}
                </a>
              ) : (
                <button
                  key={i}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 border-none bg-transparent cursor-pointer text-left hover:bg-amber-50 hover:text-amber-700 transition-colors ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
                  onClick={() => { item.onClick?.(); setOpen(false) }}
                >
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  {item.label}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
