import type { PartSchema } from './types'

interface PartSelectorProps {
  parts: Record<string, PartSchema>
  selectedPart: string
  onSelectPart: (key: string) => void
}

export default function PartSelector({ parts, selectedPart, onSelectPart }: PartSelectorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b-2 border-[#2a2d40] bg-[#12141f]">
        <h3 className="text-xs uppercase tracking-widest text-amber-500 font-semibold font-mono">Card Parts</h3>
      </div>
      <div className="flex-1 p-1 overflow-y-auto">
        {Object.entries(parts).map(([key, part]) => (
          <button
            key={key}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-sm text-left transition-colors cursor-pointer border-l-4 border-y-0 border-r-0 ${
              selectedPart === key
                ? 'bg-[#2a2d40] text-amber-400 border-l-amber-500'
                : 'bg-transparent text-gray-400 border-l-transparent hover:bg-[#1e2133] hover:text-white'
            }`}
            onClick={() => onSelectPart(key)}
          >
            <span className="text-lg">{part.icon}</span>
            <span className="flex-1 text-sm font-semibold">{part.label}</span>
            <span className="text-gray-600 text-sm">›</span>
          </button>
        ))}
      </div>
      <div className="p-4 border-t-2 border-[#2a2d40] bg-[#12141f]">
        <p className="text-xs text-gray-600 text-center font-mono">Click a part to edit</p>
      </div>
    </div>
  )
}
