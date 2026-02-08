/** CogSidebar — Collapsible sidebar with cog-driven section navigation
 *
 * A sidebar that collapses to a narrow strip of cog icons.
 * Each cog expands its section when clicked, showing nested nav items.
 * Smooth animated transitions between collapsed and expanded states.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SidebarSection {
  label: string
  icon?: React.ReactNode
  items: {
    label: string
    icon?: React.ReactNode
    onClick?: () => void
    href?: string
    active?: boolean
    badge?: string | number
  }[]
}

export interface CogSidebarProps {
  sections: SidebarSection[]
  collapsed?: boolean
  onToggle?: () => void
  width?: number
  collapsedWidth?: number
  className?: string
}

/** Small inline cog */
function MiniCog({ spinning = false }: { spinning?: boolean }) {
  return (
    <motion.svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      animate={{ rotate: spinning ? 360 : 0 }}
      transition={spinning ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </motion.svg>
  )
}

export default function CogSidebar({
  sections,
  collapsed: controlledCollapsed,
  onToggle,
  width = 260,
  collapsedWidth = 56,
  className = '',
}: CogSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<number>(0)

  const isCollapsed = controlledCollapsed ?? internalCollapsed
  const toggleCollapse = onToggle ?? (() => setInternalCollapsed(p => !p))
  const currentWidth = isCollapsed ? collapsedWidth : width

  return (
    <motion.nav
      className={`h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden ${className}`}
      animate={{ width: currentWidth }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Toggle button */}
      <button
        className="flex items-center justify-center h-12 border-b border-gray-200 cursor-pointer bg-transparent hover:bg-gray-50 transition-colors shrink-0"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.span
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500"
        >
          ⚙️
        </motion.span>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-2 text-xs font-semibold text-gray-500 uppercase tracking-wider overflow-hidden whitespace-nowrap"
            >
              Cog Works
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section, si) => (
          <div key={si} className="mb-1">
            {/* Section header (cog icon) */}
            <button
              className={`flex items-center w-full px-4 py-2.5 border-none cursor-pointer transition-colors ${
                activeSection === si
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === si ? -1 : si)}
              title={isCollapsed ? section.label : undefined}
            >
              <span className="shrink-0">
                {section.icon || <MiniCog spinning={activeSection === si} />}
              </span>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 text-sm font-semibold overflow-hidden whitespace-nowrap"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                  >
                    {section.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Section items */}
            <AnimatePresence>
              {activeSection === si && !isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {section.items.map((item, ii) => {
                    const El = item.href ? 'a' : 'button'
                    return (
                      <El
                        key={ii}
                        className={`flex items-center gap-2 w-full pl-10 pr-4 py-2 text-sm border-none cursor-pointer transition-colors ${
                          item.active
                            ? 'bg-amber-100 text-amber-800 font-medium'
                            : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={item.onClick}
                        {...(item.href ? { href: item.href } : {})}
                      >
                        {item.icon && <span className="text-base">{item.icon}</span>}
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge != null && (
                          <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs font-mono rounded-sm">
                            {item.badge}
                          </span>
                        )}
                      </El>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.nav>
  )
}
