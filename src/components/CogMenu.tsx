/** CogMenu — Radial gear-tooth navigation menu
 *
 * A settings/nav cog that rotates on hover and reveals menu items
 * arranged in a radial arc around the gear icon.
 *
 * Props:
 *   items     — Array of { label, icon?, onClick?, href?, items? (submenu) }
 *   size      — Diameter of the cog button (px), default 48
 *   radius    — Distance from center to menu items (px), default 120
 *   arc       — Spread angle in degrees, default 180
 *   startAngle — Starting angle in degrees (0 = right, 90 = down), default 225
 *   className — Additional classes on root container
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CogMenuItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  items?: CogMenuItem[]
  disabled?: boolean
}

export interface CogMenuProps {
  items: CogMenuItem[]
  size?: number
  radius?: number
  arc?: number
  startAngle?: number
  className?: string
  trigger?: 'click' | 'hover'
}

/** SVG cog/gear icon */
function CogIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export default function CogMenu({
  items,
  size = 48,
  radius = 120,
  arc = 180,
  startAngle = 225,
  className = '',
  trigger = 'click',
}: CogMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = () => { setOpen(p => !p); setActiveSubmenu(null) }

  const angleStep = items.length > 1 ? arc / (items.length - 1) : 0
  const toRad = (deg: number) => (deg * Math.PI) / 180

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: radius * 2 + size, height: radius * 2 + size }}
      onMouseEnter={trigger === 'hover' ? () => setOpen(true) : undefined}
      onMouseLeave={trigger === 'hover' ? () => { setOpen(false); setActiveSubmenu(null) } : undefined}
    >
      {/* Center cog button */}
      <motion.button
        className="relative z-10 flex items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-600 shadow-md cursor-pointer hover:border-amber-500 hover:text-amber-600 transition-colors"
        style={{ width: size, height: size }}
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={trigger === 'click' ? toggle : undefined}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <CogIcon size={size * 0.5} />
      </motion.button>

      {/* Radial menu items */}
      <AnimatePresence>
        {open && items.map((item, i) => {
          const angle = startAngle + angleStep * i
          const x = Math.cos(toRad(angle)) * radius
          const y = Math.sin(toRad(angle)) * radius

          return (
            <motion.div
              key={i}
              className="absolute z-20"
              style={{ left: '50%', top: '50%' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
              animate={{ x, y, opacity: 1, scale: 1 }}
              exit={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.04 }}
            >
              <div className="-translate-x-1/2 -translate-y-1/2">
                {item.href ? (
                  <a
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-none border border-gray-200 bg-white shadow-lg text-sm font-medium whitespace-nowrap hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 transition-colors ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    {item.label}
                  </a>
                ) : (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-none border border-gray-200 bg-white shadow-lg text-sm font-medium whitespace-nowrap cursor-pointer hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 transition-colors ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
                    onClick={() => {
                      if (item.items) {
                        setActiveSubmenu(activeSubmenu === i ? null : i)
                      } else {
                        item.onClick?.()
                        setOpen(false)
                        setActiveSubmenu(null)
                      }
                    }}
                  >
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    {item.label}
                    {item.items && <span className="text-xs text-gray-400 ml-1">▸</span>}
                  </button>
                )}

                {/* Submenu dropdown */}
                <AnimatePresence>
                  {item.items && activeSubmenu === i && (
                    <motion.div
                      className="absolute left-full top-0 ml-1 flex flex-col border border-gray-200 bg-white shadow-xl overflow-hidden"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.items.map((sub, j) => (
                        <button
                          key={j}
                          className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap border-none bg-white cursor-pointer hover:bg-amber-50 hover:text-amber-700 transition-colors ${sub.disabled ? 'opacity-40 pointer-events-none' : ''}`}
                          onClick={() => {
                            sub.onClick?.()
                            setOpen(false)
                            setActiveSubmenu(null)
                          }}
                        >
                          {sub.icon && <span className="text-base">{sub.icon}</span>}
                          {sub.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
