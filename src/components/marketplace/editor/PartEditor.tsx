import { useState, useRef } from 'react'
import type { CardEditorData, PartSchema, FieldSchema } from './types'

interface PartEditorProps {
  part: string
  partSchema: PartSchema | undefined
  card: CardEditorData
  onUpdateField: (key: string, value: string | number) => void
  onUpdateFields: (updates: Record<string, string | number>) => void
}

export default function PartEditor({ part, partSchema, card, onUpdateField, onUpdateFields }: PartEditorProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!partSchema) {
    return <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm">Select a part to edit</div>
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
    onUpdateField(part === 'stats' ? `stats.${fieldKey}` : fieldKey, value)
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
      const min = fieldSchema.min || 1, max = fieldSchema.max || 10
      value = Math.floor(Math.random() * (max - min + 1)) + min
    } else if (fieldSchema.type === 'select' && fieldSchema.options) {
      value = fieldSchema.options[Math.floor(Math.random() * fieldSchema.options.length)]
    }
    if (value !== undefined) handleFieldChange(fieldKey, value)
  }

  const inputClass = "w-full px-3 py-2.5 bg-[#12141f] border-2 border-[#2a2d40] rounded-sm text-sm text-gray-200 focus:border-amber-500 outline-none"

  const renderField = (fieldKey: string, fieldSchema: FieldSchema) => {
    const value = getFieldValue(fieldKey)

    switch (fieldSchema.type) {
      case 'string':
        return (
          <div key={fieldKey} className="mb-5">
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-300">
              {fieldSchema.label}
              {fieldSchema.optional && <span className="text-xs px-1.5 py-0.5 bg-[#2a2d40] text-gray-500 rounded-sm">Optional</span>}
            </label>
            <input type="text" className={inputClass} value={(value as string) || ''} placeholder={fieldSchema.placeholder}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)} />
          </div>
        )
      case 'number':
        return (
          <div key={fieldKey} className="mb-5">
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-300">
              {fieldSchema.label}
              <span className="ml-auto px-2.5 py-0.5 bg-amber-900/30 text-amber-400 rounded-sm font-mono text-sm font-bold">
                {value || fieldSchema.min || 0}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input type="range" className="flex-1 h-2 bg-[#2a2d40] rounded-sm appearance-none cursor-pointer accent-amber-500"
                min={fieldSchema.min || 0} max={fieldSchema.max || 10}
                value={(value as number) || fieldSchema.min || 0}
                onChange={(e) => handleFieldChange(fieldKey, parseInt(e.target.value))} />
              <button className="w-8 h-8 flex items-center justify-center bg-[#2a2d40] hover:bg-amber-900/30 rounded-sm text-sm cursor-pointer border-none text-gray-500 hover:text-amber-400"
                onClick={() => handleRandomize(fieldKey, fieldSchema)} title="Randomize">🎲</button>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-600 font-mono">
              <span>{fieldSchema.min || 0}</span><span>{fieldSchema.max || 10}</span>
            </div>
          </div>
        )
      case 'textarea':
        return (
          <div key={fieldKey} className="mb-5">
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-300">{fieldSchema.label}</label>
            <textarea className={`${inputClass} resize-y min-h-20`} rows={fieldSchema.rows || 3}
              value={(value as string) || ''} placeholder={fieldSchema.placeholder}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)} />
          </div>
        )
      case 'select':
        return (
          <div key={fieldKey} className="mb-5">
            <label className="block mb-2 text-sm font-semibold text-gray-300">{fieldSchema.label}</label>
            <div className="flex gap-2">
              <select className={`${inputClass} flex-1 appearance-none cursor-pointer`}
                value={(value as string) || fieldSchema.options?.[0]}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}>
                {fieldSchema.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <button className="w-8 h-8 flex items-center justify-center bg-[#2a2d40] hover:bg-amber-900/30 rounded-sm text-sm cursor-pointer border-none"
                onClick={() => handleRandomize(fieldKey, fieldSchema)} title="Randomize">🎲</button>
            </div>
          </div>
        )
      case 'image':
        return (
          <div key={fieldKey} className="mb-5">
            <label className="block mb-2 text-sm font-semibold text-gray-300">{fieldSchema.label}</label>
            {(imagePreview || card.imageData) ? (
              <div className="relative">
                <img src={imagePreview || card.imageData} alt="Card" className="w-full h-48 object-cover rounded-sm border-2 border-[#2a2d40]" />
                <button className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#1a1d2e]/90 rounded-sm text-xs font-semibold text-gray-300 cursor-pointer border-2 border-[#2a2d40] hover:border-amber-500"
                  onClick={() => fileInputRef.current?.click()}>Change Image</button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-[#12141f] border-2 border-dashed border-[#2a2d40] rounded-sm cursor-pointer hover:border-amber-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <span className="text-4xl">🖼️</span>
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs text-gray-700">PNG, JPG up to 5MB</span>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
        )
      case 'palette':
        return (
          <div key={fieldKey} className="mb-5">
            <label className="block mb-2 text-sm font-semibold text-gray-300">{fieldSchema.label}</label>
            <div className="grid grid-cols-3 gap-3">
              {card.colors && Object.keys(card.colors).length > 0 ? (
                Object.entries(card.colors).map(([name, val]) => (
                  <div key={name} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-sm border-2 border-[#2a2d40]" style={{ backgroundColor: val }} title={name} />
                    <span className="text-xs text-gray-500 capitalize font-mono">{name}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-6 text-gray-600 text-sm">Upload an image to extract colors</div>
              )}
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-[#2a2d40] bg-[#12141f]">
        <span className="text-2xl">{partSchema.icon}</span>
        <h3 className="text-base font-bold text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>{partSchema.label}</h3>
      </div>
      <div className="flex-1 p-5 overflow-y-auto">
        {Object.entries(partSchema.fields).map(([key, schema]) => renderField(key, schema))}
      </div>
      {part === 'stats' && (
        <div className="p-5 border-t-2 border-[#2a2d40] bg-[#12141f]">
          <button
            className="w-full py-3 bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 rounded-sm text-sm font-semibold cursor-pointer border-2 border-amber-700/50 transition-colors"
            onClick={() => {
              onUpdateFields({
                'stats.hp': Math.floor(Math.random() * 15) + 5,
                'stats.attack': Math.floor(Math.random() * 12) + 3,
                'stats.defense': Math.floor(Math.random() * 12) + 3,
                'stats.mana': Math.floor(Math.random() * 8) + 2,
                'stats.crit': Math.floor(Math.random() * 20) + 1,
              })
            }}
          >🎲 Randomize All Stats</button>
        </div>
      )}
    </div>
  )
}
