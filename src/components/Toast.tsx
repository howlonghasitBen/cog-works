import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; type: ToastType; exiting: boolean }

interface ToastCtx {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

const Ctx = createContext<ToastCtx>({ success: () => {}, error: () => {}, info: () => {} })
export const useToast = () => useContext(Ctx)

const COLORS: Record<ToastType, string> = { success: '#4ade80', error: '#f87171', info: '#60a5fa' }

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  return (
    <div
      ref={ref}
      style={{
        background: '#1a1d2e',
        borderLeft: `4px solid ${COLORS[toast.type]}`,
        color: '#d0d0d0',
        padding: '12px 18px',
        borderRadius: 4,
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        marginTop: 8,
        animation: toast.exiting ? 'toastOut 0.3s ease forwards' : 'toastIn 0.3s ease forwards',
        maxWidth: 340,
        wordBreak: 'break-word' as const,
      }}
    >
      {toast.message}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }, [])

  const add = useCallback((message: string, type: ToastType) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, message, type, exiting: false }])
  }, [])

  const ctx: ToastCtx = {
    success: useCallback((m: string) => add(m, 'success'), [add]),
    error: useCallback((m: string) => add(m, 'error'), [add]),
    info: useCallback((m: string) => add(m, 'info'), [add]),
  }

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column-reverse' }}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
      <style>{`
        @keyframes toastIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes toastOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      `}</style>
    </Ctx.Provider>
  )
}
