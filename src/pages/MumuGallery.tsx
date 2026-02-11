/** MumuGallery — Collection gallery for mumu-frens v2 */
import { useState, useMemo } from 'react'

const TOTAL = 100
const images = Array.from({ length: TOTAL }, (_, i) => ({
  id: i + 1,
  src: `/images/mumuFrensv2Images/mumu-${String(i + 1).padStart(3, '0')}.png`,
  name: `Mumu #${i + 1}`,
}))

export default function MumuGallery() {
  const [selected, setSelected] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search) return images
    const q = search.toLowerCase()
    return images.filter(img => img.name.toLowerCase().includes(q) || String(img.id).includes(q))
  }, [search])

  const selectedImg = images.find(i => i.id === selected)

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
          Mumu Frens Collection
        </h1>
        <span style={{
          fontSize: 13, fontFamily: "'DM Mono', monospace",
          color: '#7a7d8a',
        }}>
          {filtered.length} / {TOTAL}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by # ..."
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
        {filtered.map(img => (
          <div
            key={img.id}
            onClick={() => setSelected(img.id)}
            style={{
              cursor: 'pointer',
              borderRadius: 4,
              overflow: 'hidden',
              border: `2px solid ${selected === img.id ? '#c8a55a' : '#3a3d4a'}`,
              background: 'linear-gradient(180deg, #2a2d3a, #1a1d2e)',
              boxShadow: selected === img.id
                ? '0 0 15px rgba(200,165,90,0.3)'
                : '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
              <img
                src={img.src}
                alt={img.name}
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
              }}>
                {img.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 600, maxHeight: '85vh',
              border: '3px solid #c8a55a',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(200,165,90,0.3)',
              background: '#1a1d2e',
            }}
          >
            <img
              src={selectedImg.src}
              alt={selectedImg.name}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            <div style={{
              padding: '12px 16px',
              borderTop: '2px solid #3a3d4a',
              textAlign: 'center',
            }}>
              <p style={{
                margin: 0, fontSize: 16, fontWeight: 800,
                color: '#c8a55a', fontFamily: "'Cinzel', serif",
              }}>
                {selectedImg.name}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&display=swap");
      `}</style>
    </div>
  )
}
