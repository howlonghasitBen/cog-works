import { useState, useEffect, useRef, CSSProperties } from 'react'

export type LogType = 'success' | 'error' | 'warn' | 'info' | 'ownership' | 'system' | 'default'
export type LogFilter = 'all' | 'transfers' | 'ownership' | 'errors'

export interface LogEntry {
  id: number
  time: string
  type: LogType
  message: string
  hash?: string
  category: 'transfer' | 'ownership' | 'error' | 'system' | 'other'
}

interface Props {
  logs: LogEntry[]
  onClear?: () => void
}

const COLOR_MAP: Record<LogType, string> = {
  success: '#00ffaa',
  error: '#ff4444',
  warn: '#ffaa00',
  info: '#22d3ee',
  ownership: '#c8a55a',
  system: '#8888aa',
  default: '#cccccc',
}

const FILTERS: { key: LogFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'transfers', label: 'TRANSFERS' },
  { key: 'ownership', label: 'OWNERSHIP' },
  { key: 'errors', label: 'ERRORS' },
]

export default function WhirlpoolTerminal({ logs, onClear }: Props) {
  const [filter, setFilter] = useState<LogFilter>('all')
  const [scrollLocked, setScrollLocked] = useState(false)
  const termRef = useRef<HTMLDivElement>(null)

  const filtered = logs.filter(l => {
    if (filter === 'all') return true
    if (filter === 'transfers') return l.category === 'transfer'
    if (filter === 'ownership') return l.category === 'ownership'
    if (filter === 'errors') return l.category === 'error'
    return true
  })

  useEffect(() => {
    if (!scrollLocked && termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [logs, scrollLocked])

  const copyLogs = () => {
    navigator.clipboard.writeText(filtered.map(l => `[${l.time}] ${l.message}`).join('\n'))
  }

  const s: Record<string, CSSProperties> = {
    wrapper: {
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
      background: '#0a0c14', borderRadius: 4, border: '1px solid #2a2d40',
      fontFamily: "'DM Mono', 'Fira Code', monospace", fontSize: 11, overflow: 'hidden',
    },
    toolbar: {
      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
      borderBottom: '1px solid #1a1d2e', background: '#0d0f18', flexShrink: 0,
    },
    filterBtn: {
      padding: '2px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
      border: '1px solid #2a2d40', borderRadius: 2, cursor: 'pointer',
      background: 'transparent', color: '#666',
    },
    filterBtnActive: {
      background: 'rgba(34,211,238,0.15)', color: '#22d3ee', borderColor: '#22d3ee',
    },
    actionBtn: {
      padding: '2px 8px', fontSize: 9, fontWeight: 700,
      border: '1px solid #2a2d40', borderRadius: 2, cursor: 'pointer',
      background: 'transparent', color: '#888', marginLeft: 'auto',
    },
    logArea: {
      flex: 1, overflowY: 'auto', padding: '4px 0', minHeight: 0,
    },
    logLine: {
      display: 'flex', padding: '1px 8px', lineHeight: '18px',
    },
    lineNo: {
      width: 28, textAlign: 'right', color: '#333', marginRight: 8, flexShrink: 0, userSelect: 'none',
    },
    time: {
      color: '#555', marginRight: 8, flexShrink: 0,
    },
    statusBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '3px 8px', borderTop: '1px solid #1a1d2e', background: '#0d0f18',
      fontSize: 9, color: '#555', flexShrink: 0,
    },
  }

  return (
    <div style={s.wrapper}>
      <div style={s.toolbar}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            style={{ ...s.filterBtn, ...(filter === f.key ? s.filterBtnActive : {}) }}
            onClick={() => setFilter(f.key)}
          >{f.label}</button>
        ))}
        <button style={s.actionBtn} onClick={copyLogs}>COPY</button>
        <button style={{ ...s.actionBtn, marginLeft: 4 }} onClick={onClear}>CLEAR</button>
        <button
          style={{ ...s.actionBtn, marginLeft: 4, color: scrollLocked ? '#ffaa00' : '#888' }}
          onClick={() => setScrollLocked(p => !p)}
        >{scrollLocked ? '🔒' : '🔓'}</button>
      </div>
      <div ref={termRef} style={s.logArea}>
        {filtered.map((l, i) => (
          <div key={l.id} style={s.logLine}>
            <span style={s.lineNo as CSSProperties}>{i + 1}</span>
            <span style={s.time}>{l.time}</span>
            <span style={{ color: COLOR_MAP[l.type] || '#ccc' }}>{l.message}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ ...s.logLine, color: '#333' }}>No logs</div>
        )}
      </div>
      <div style={s.statusBar}>
        <span>{filtered.length} / {logs.length} entries</span>
        <span>ERC-1142 · Whirlpool Terminal</span>
      </div>
    </div>
  )
}
