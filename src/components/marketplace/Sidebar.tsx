interface SidebarProps {
  sortBy: string
  setSortBy: (s: string) => void
  filterStaked: boolean
  setFilterStaked: (b: boolean) => void
  filterOwned: boolean
  setFilterOwned: (b: boolean) => void
}

export default function Sidebar({ sortBy, setSortBy, filterStaked, setFilterStaked, filterOwned, setFilterOwned }: SidebarProps) {
  const btnClass = (active: boolean) =>
    `w-full text-left px-3 py-2 text-sm rounded-sm border-2 cursor-pointer transition-colors ${
      active
        ? 'bg-[#2a2d40] border-cyan-500/60 text-cyan-300'
        : 'bg-[#1a1d2e] border-[#2a2d40] text-gray-400 hover:text-white hover:border-gray-600'
    }`

  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col gap-5 pr-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3 font-mono">Filters</h3>
        <div className="flex flex-col gap-2">
          <button className={btnClass(filterStaked)} onClick={() => setFilterStaked(!filterStaked)}>🔒 Staked Only</button>
          <button className={btnClass(filterOwned)} onClick={() => setFilterOwned(!filterOwned)}>👤 Owned by Me</button>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3 font-mono">Sort By</h3>
        <div className="flex flex-col gap-2">
          {[
            { key: 'id', label: '# ID' },
            { key: 'price-asc', label: '↑ Price Low' },
            { key: 'price-desc', label: '↓ Price High' },
            { key: 'name', label: 'A-Z Name' },
          ].map(s => (
            <button key={s.key} className={btnClass(sortBy === s.key)} onClick={() => setSortBy(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>
    </aside>
  )
}
