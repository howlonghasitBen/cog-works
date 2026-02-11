/** Steampunk Part Selector — cog-themed vertical nav for card editor */
import { useState } from 'react'
import type { PartSchema } from '@marketplace/components/editor/types'

interface CogPartSelectorProps {
  parts: Record<string, PartSchema>
  selectedPart: string
  onSelectPart: (key: string) => void
}

/* Part-specific icons rendered inside cog frames */
const PART_ICONS: Record<string, string> = {
  identity: '🏷️',
  artwork: '🖼️',
  stats: '⚔️',
  flavor: '📜',
}

export default function CogPartSelector({ parts, selectedPart, onSelectPart }: CogPartSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const partEntries = Object.entries(parts)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      background: 'linear-gradient(180deg, #2a2d3a 0%, #1a1d2e 40%, #22252f 100%)',
      borderRadius: 4,
      border: '2px solid #3a3d4a',
      overflow: 'visible',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '2px solid #3a3d4a',
        background: 'linear-gradient(180deg, #333648 0%, #2a2d3a 100%)',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#c8a55a',
          fontFamily: "'Cinzel', 'DM Mono', serif",
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}>
          Cog Works Parts
        </h3>
      </div>

      {/* Part buttons */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {partEntries.map(([key, part]) => {
          const isActive = selectedPart === key
          const isHover = hovered === key

          return (
            <button
              key={key}
              onClick={() => onSelectPart(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                border: `2px solid ${isActive ? '#c8a55a' : isHover ? '#8a7a4a' : '#4a4d5a'}`,
                borderRadius: 2,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                background: isActive
                  ? 'linear-gradient(180deg, #b8863a 0%, #8a6528 40%, #a07530 100%)'
                  : isHover
                    ? 'linear-gradient(180deg, #3a3d50 0%, #2d3040 100%)'
                    : 'linear-gradient(180deg, #333648 0%, #282b38 100%)',
                boxShadow: isActive
                  ? 'inset 0 1px 0 rgba(255,220,150,0.3), 0 2px 8px rgba(200,165,90,0.3)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {/* Cog icon frame */}
              <div style={{
                position: 'relative',
                zIndex: 1,
                width: 36,
                height: 36,
                flexShrink: 0,
              }}>
                <img
                  src="/images/nav_cog.svg"
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    filter: isActive
                      ? 'brightness(1.2) sepia(0.3) saturate(1.5) hue-rotate(-10deg)'
                      : 'brightness(0.7) saturate(0.5)',
                    transition: 'filter 0.2s ease',
                    animation: isActive ? 'cogSpinInPlace 8s linear infinite' : 'none',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 14,
                  lineHeight: 1,
                }}>
                  {PART_ICONS[key] || '⚙️'}
                </span>
              </div>

              {/* Label */}
              <span style={{
                flex: 1,
                zIndex: 1,
                textAlign: 'left',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'Cinzel', 'Inter Tight', serif",
                color: isActive ? '#1a1a1a' : '#d0d0d0',
                textShadow: isActive
                  ? '0 1px 0 rgba(255,220,150,0.4)'
                  : '0 1px 2px rgba(0,0,0,0.5)',
                letterSpacing: '0.03em',
                transition: 'color 0.2s ease',
              }}>
                {part.label}
              </span>

              {/* Arrow */}
              <span style={{
                fontSize: 14,
                color: isActive ? '#1a1a1a' : '#6a6d7a',
                transition: 'transform 0.2s ease',
                transform: isActive ? 'translateX(2px)' : 'none',
              }}>
                ›
              </span>

              {/* Decorative cog — right end, underneath content */}
              <img
                src="/images/nav_cog.svg"
                alt=""
                style={{
                  position: 'absolute',
                  right: -30,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 48,
                  height: 48,
                  opacity: 1,
                  filter: isActive
                    ? 'brightness(1.3) sepia(0.5) saturate(2) hue-rotate(-10deg)'
                    : 'brightness(0.6) saturate(0.4)',
                  pointerEvents: 'none',
                  zIndex: -1,
                  animation: isActive ? 'cogSpin 10s linear infinite' : 'none',
                  transition: 'filter 0.3s ease',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '2px solid #3a3d4a',
        background: 'linear-gradient(180deg, #2a2d3a 0%, #333648 100%)',
        textAlign: 'center',
      }}>
        <p style={{
          margin: 0,
          fontSize: 11,
          color: '#7a7d8a',
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Click a part to edit
        </p>
      </div>

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&display=swap");
        @keyframes cogSpinInPlace {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cogSpin {
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
