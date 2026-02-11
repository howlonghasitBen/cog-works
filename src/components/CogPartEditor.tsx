/** Steampunk-themed wrapper for PartEditor — matches CogPartSelector style */
import { useState, useRef } from 'react'
import type { CardEditorData, PartSchema, FieldSchema } from '@marketplace/components/editor/types'

interface CogPartEditorProps {
  part: string
  partSchema: PartSchema | undefined
  card: CardEditorData
  onUpdateField: (key: string, value: string | number) => void
  onUpdateFields: (updates: Record<string, string | number>) => void
}

export default function CogPartEditor({ part, partSchema, card, onUpdateField, onUpdateFields }: CogPartEditorProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!partSchema) {
    return (
      <div style={{
        ...panelStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        color: '#7a7d8a',
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
      }}>
        Select a part to edit
      </div>
    )
  }

  const getFieldValue = (fieldKey: string): string | number | undefined => {
    if (fieldKey.includes('.')) {
      const parts = fieldKey.split('.')
      let value: unknown = card
      for (const p of parts) value = (value as Record<string, unknown>)?.[p]
      return value as string | number | undefined
    }
    if (part === 'stats') return card.stats?.[fieldKey as keyof typeof card.stats]
    return (card as unknown as Record<string, unknown>)[fieldKey] as string | number | undefined
  }

  const handleFieldChange = (fieldKey: string, value: string | number) => {
    if (part === 'stats') onUpdateField(`stats.${fieldKey}`, value)
    else onUpdateField(fieldKey, value)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result as string
      setImagePreview(data)
      onUpdateField('imageData', data)
    }
    reader.readAsDataURL(file)
  }

  const handleRandomize = (fieldKey: string, fieldSchema: FieldSchema) => {
    let value: string | number | undefined
    if (fieldSchema.type === 'number') {
      const min = fieldSchema.min || 1
      const max = fieldSchema.max || 10
      value = Math.floor(Math.random() * (max - min + 1)) + min
    } else if (fieldSchema.type === 'select' && fieldSchema.options) {
      value = fieldSchema.options[Math.floor(Math.random() * fieldSchema.options.length)]
    }
    if (value !== undefined) handleFieldChange(fieldKey, value)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: '#1a1d2e',
    border: '1px solid #4a4d5a',
    color: '#d0d0d0',
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    outline: 'none',
    borderRadius: 2,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 700,
    color: '#c8a55a',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '0.03em',
  }

  const diceStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #333648 0%, #282b38 100%)',
    border: '1px solid #4a4d5a',
    borderRadius: 2,
    cursor: 'pointer',
    fontSize: 14,
    flexShrink: 0,
  }

  const renderField = (fieldKey: string, fieldSchema: FieldSchema) => {
    const value = getFieldValue(fieldKey)

    switch (fieldSchema.type) {
      case 'string':
        return (
          <div key={fieldKey} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              {fieldSchema.label}
              {fieldSchema.optional && <span style={{ fontSize: 10, padding: '1px 6px', background: '#333648', color: '#7a7d8a', borderRadius: 2 }}>Optional</span>}
            </label>
            <input
              type="text"
              style={inputStyle}
              value={(value as string) || ''}
              placeholder={fieldSchema.placeholder}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            />
          </div>
        )

      case 'number':
        return (
          <div key={fieldKey} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              {fieldSchema.label}
              <span style={{ marginLeft: 'auto', padding: '2px 8px', background: 'linear-gradient(180deg, #b8863a, #8a6528)', color: '#1a1a1a', fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, borderRadius: 2 }}>
                {value || fieldSchema.min || 0}
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                style={{ flex: 1, accentColor: '#c8a55a', height: 6, cursor: 'pointer' }}
                min={fieldSchema.min || 0}
                max={fieldSchema.max || 10}
                value={(value as number) || fieldSchema.min || 0}
                onChange={(e) => handleFieldChange(fieldKey, parseInt(e.target.value))}
              />
              <button style={diceStyle} onClick={() => handleRandomize(fieldKey, fieldSchema)} title="Randomize">🎲</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#5a5d6a', fontFamily: "'DM Mono', monospace" }}>
              <span>{fieldSchema.min || 0}</span>
              <span>{fieldSchema.max || 10}</span>
            </div>
          </div>
        )

      case 'textarea':
        return (
          <div key={fieldKey} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{fieldSchema.label}</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              rows={fieldSchema.rows || 3}
              value={(value as string) || ''}
              placeholder={fieldSchema.placeholder}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            />
          </div>
        )

      case 'select':
        return (
          <div key={fieldKey} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{fieldSchema.label}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                style={{ ...inputStyle, flex: 1, cursor: 'pointer', appearance: 'none' }}
                value={(value as string) || fieldSchema.options?.[0]}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              >
                {fieldSchema.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <button style={diceStyle} onClick={() => handleRandomize(fieldKey, fieldSchema)} title="Randomize">🎲</button>
            </div>
          </div>
        )

      case 'image':
        return (
          <div key={fieldKey} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{fieldSchema.label}</label>
            {(imagePreview || card.imageData) ? (
              <div style={{ position: 'relative' }}>
                <img src={imagePreview || card.imageData} alt="Card" style={{ width: '100%', height: 140, objectFit: 'cover', border: '1px solid #4a4d5a', borderRadius: 2 }} />
                <button
                  style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', padding: '6px 14px', background: 'rgba(26,29,46,0.9)', border: '1px solid #4a4d5a', color: '#d0d0d0', fontSize: 11, cursor: 'pointer', borderRadius: 2 }}
                  onClick={() => fileInputRef.current?.click()}
                >Change Image</button>
              </div>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 140, border: '2px dashed #4a4d5a', borderRadius: 2, cursor: 'pointer', color: '#5a5d6a', gap: 6, background: '#1a1d2e' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ fontSize: 32 }}>🖼️</span>
                <span style={{ fontSize: 12 }}>Click to upload</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
        )

      case 'palette':
        return (
          <div key={fieldKey} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{fieldSchema.label}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {card.colors && Object.keys(card.colors).length > 0 ? (
                Object.entries(card.colors).map(([name, color]) => (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 2, border: '1px solid #4a4d5a', backgroundColor: color }} />
                    <span style={{ fontSize: 10, color: '#7a7d8a', fontFamily: "'DM Mono', monospace" }}>{name}</span>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 20, color: '#5a5d6a', fontSize: 12 }}>
                  Upload an image to extract colors
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '2px solid #3a3d4a',
        background: 'linear-gradient(180deg, #333648 0%, #2a2d3a 100%)',
      }}>
        <span style={{ fontSize: 20 }}>{partSchema.icon}</span>
        <h3 style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 800,
          color: '#c8a55a',
          fontFamily: "'Cinzel', serif",
          letterSpacing: '0.08em',
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}>
          {partSchema.label}
        </h3>
      </div>

      {/* Fields */}
      <div style={{ padding: 16, overflowY: 'auto' }}>
        {Object.entries(partSchema.fields).map(([key, schema]) => renderField(key, schema))}
      </div>

      {/* Randomize all stats button */}
      {part === 'stats' && (
        <div style={{
          padding: '12px 16px',
          borderTop: '2px solid #3a3d4a',
          background: 'linear-gradient(180deg, #2a2d3a 0%, #333648 100%)',
        }}>
          <button
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'linear-gradient(180deg, #b8863a 0%, #8a6528 100%)',
              border: '2px solid #c8a55a',
              color: '#1a1a1a',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.05em',
              cursor: 'pointer',
              borderRadius: 2,
            }}
            onClick={() => {
              onUpdateFields({
                'stats.hp': Math.floor(Math.random() * 15) + 5,
                'stats.attack': Math.floor(Math.random() * 12) + 3,
                'stats.defense': Math.floor(Math.random() * 12) + 3,
                'stats.mana': Math.floor(Math.random() * 8) + 2,
                'stats.crit': Math.floor(Math.random() * 20) + 1,
              })
            }}
          >
            🎲 Randomize All Stats
          </button>
        </div>
      )}

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&display=swap");
      `}</style>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #2a2d3a 0%, #1a1d2e 40%, #22252f 100%)',
  borderRadius: 4,
  border: '2px solid #3a3d4a',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}
