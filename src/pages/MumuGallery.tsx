/** MumuGallery — Collection gallery for mumu-frens v2 */
import { useState, useEffect, useMemo } from 'react'

interface MumuItem {
  file: string
  id?: number
  name?: string
  traits?: Record<string, string>
}

export default function MumuGallery() {
  const [items, setItems] = useState<MumuItem[]>([])
  const [selected, setSelected] = useState<MumuItem | null>(null)
  const [search, setSearch] = useState('')

  // Load manifest
  useEffect(() => {
    fetch('/images/mumuFrensv2Images/manifest.json')
      .then(r => r.json())
      .then((data: MumuItem[]) => setItems(data))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.file || '').toLowerCase().includes(q) ||
      String(m.id || '').includes(q)
    )
  }, [search, items])

  return (
    <div style={{ marginTop: 60, minHeight: '100vh', width: '100%', padding: '24px 40px 80px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, paddingBottom: 16,
        borderBottom: '2px solid #3a3d4a',
      }}>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 800,
          fontFamily: "'Cinzel', serif", color: '#c8a55a',
          letterSpacing: '0.1em', textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}>
          Mumu Frens v2
        </h1>
        <span style={{
          fontSize: 13, fontFamily: "'DM Mono', monospace",
          color: '#7a7d8a',
        }}>
          {filtered.length} / {items.length}
        </span>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name or # ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, maxWidth: 280, padding: '8px 14px',
            background: '#1a1d2e', border: '1px solid #4a4d5a',
            color: '#d0d0d0', fontSize: 13, fontFamily: "'DM Mono', monospace",
            borderRadius: 2, outline: 'none',
          }}
        />
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 12,
      }}>
        {filtered.map(item => (
          <div
            key={item.file}
            onClick={() => setSelected(item)}
            style={{
              cursor: 'pointer',
              borderRadius: 4,
              overflow: 'hidden',
              border: `2px solid ${selected?.file === item.file ? '#c8a55a' : '#3a3d4a'}`,
              background: 'linear-gradient(180deg, #2a2d3a, #1a1d2e)',
              boxShadow: selected?.file === item.file
                ? '0 0 15px rgba(200,165,90,0.3)'
                : '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
              <img
                src={`/images/mumuFrensv2Images/${item.file}`}
                alt={item.name || item.file}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{
              padding: '6px 8px',
              borderTop: '1px solid #3a3d4a',
            }}>
              <p style={{
                margin: 0, fontSize: 11, fontWeight: 700,
                color: '#d0d0d0', fontFamily: "'Cinzel', serif",
                textAlign: 'center',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {item.name || `#${item.id}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox with metadata sidebar */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            padding: 40,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex',
              maxWidth: 900, maxHeight: '85vh',
              border: '3px solid #c8a55a',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(200,165,90,0.3)',
              background: '#1a1d2e',
              cursor: 'default',
            }}
          >
            {/* Image */}
            <div style={{ flex: '1 1 60%', minWidth: 0, display: 'flex', alignItems: 'center', background: '#111' }}>
              <img
                src={`/images/mumuFrensv2Images/${selected.file}`}
                alt={selected.name || selected.file}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            {/* Metadata sidebar */}
            <div style={{
              flex: '0 0 260px', padding: '24px 20px',
              borderLeft: '2px solid #3a3d4a',
              overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <h2 style={{
                margin: 0, fontSize: 18, fontWeight: 800,
                color: '#c8a55a', fontFamily: "'Cinzel', serif",
              }}>
                {selected.name || `Mumu #${selected.id}`}
              </h2>
              <p style={{
                margin: 0, fontSize: 12, color: '#7a7d8a',
                fontFamily: "'DM Mono', monospace",
              }}>
                #{String(selected.id || 0).padStart(3, '0')}
              </p>

              {selected.traits && Object.keys(selected.traits).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h3 style={{
                    margin: 0, fontSize: 12, fontWeight: 700,
                    color: '#8a8d9a', fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    paddingBottom: 6, borderBottom: '1px solid #3a3d4a',
                  }}>
                    Traits
                  </h3>
                  {Object.entries(selected.traits).map(([key, val]) => (
                    <div key={key} style={{
                      display: 'flex', flexDirection: 'column', gap: 2,
                    }}>
                      <span style={{
                        fontSize: 10, color: '#6a6d7a',
                        fontFamily: "'DM Mono', monospace",
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {key}
                      </span>
                      <span style={{
                        fontSize: 13, color: '#d0d0d0',
                        fontFamily: "'DM Mono', monospace",
                        padding: '4px 8px',
                        background: '#2a2d3a',
                        border: '1px solid #3a3d4a',
                        borderRadius: 2,
                      }}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginTop: 'auto', padding: '8px 16px',
                  background: '#2a2d3a', border: '1px solid #4a4d5a',
                  color: '#c8a55a', fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  cursor: 'pointer', borderRadius: 2,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#3a3d4a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2a2d3a')}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
