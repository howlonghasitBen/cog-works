import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { createPublicClient, http, formatEther, parseEther, maxUint256 } from 'viem'
import type { LogEntry, LogType } from '../components/WhirlpoolTerminal'
import {
  WHIRLPOOL_ADDRESS, WAVES_ADDRESS, WETH_ADDRESS, SURFSWAP_ADDRESS, ROUTER_ADDRESS, BIDNFT_ADDRESS,
  WETH_POOL_ADDRESS, WETH_POOL_ABI,
  GLOBAL_REWARDS_ADDRESS, GLOBAL_REWARDS_ABI,
  WHIRLPOOL_ABI, WAVES_ABI, CARD_TOKEN_ABI, WETH_ABI, SURFSWAP_ABI, ROUTER_ABI, BIDNFT_ABI,
} from '../contracts/erc1142'
import { anvilChain } from '../contracts/wagmi-config'

export interface CardState {
  id: number
  name: string
  symbol: string
  uri: string
  address: `0x${string}`
  owner: string
  price: string
  wavesReserve: string
  cardReserve: string
  myStake: string      // effective token balance (what you'd get if you unstaked all)
  myShares: string     // raw LP shares (for unstake/swapStake calls)
  myBalance: string
}

const publicClient = createPublicClient({
  chain: anvilChain as any,
  transport: http('http://192.168.0.82:8545'),
})

// ═══════════════════════════════════════════════════════════
//  Shared module-level cache — survives page navigation
//  Cards stay hot for CACHE_TTL_MS after last consumer unmounts
// ═══════════════════════════════════════════════════════════
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

interface SharedState {
  cards: CardState[]
  wavesBalance: string
  ethBalance: string
  wethBalance: string
  wethPoolWaves: string
  wethPoolWeth: string
  myWethShares: string
  myWethStake: string
  claimableWeth: string
  claimableWaves: string
  pendingGlobal: string
  lastAddress: string | undefined
  lastLoadTime: number
  loading: boolean
}

const _shared: SharedState = {
  cards: [],
  wavesBalance: '0',
  ethBalance: '0',
  wethBalance: '0',
  wethPoolWaves: '0',
  wethPoolWeth: '0',
  myWethShares: '0',
  myWethStake: '0',
  claimableWeth: '0',
  claimableWaves: '0',
  pendingGlobal: '0',
  lastAddress: undefined,
  lastLoadTime: 0,
  loading: false,
}

// Listeners for shared state changes
const _listeners = new Set<() => void>()
function notifyListeners() { _listeners.forEach(fn => fn()) }

// Polling management — only poll while consumers exist, keep alive for TTL after
let _pollInterval: ReturnType<typeof setInterval> | null = null
let _ttlTimeout: ReturnType<typeof setTimeout> | null = null
let _consumerCount = 0
let _unwatchFns: (() => void)[] = []
let _currentAddress: string | undefined

function startPolling() {
  if (_pollInterval) return
  _pollInterval = setInterval(() => loadCardsShared(_currentAddress), 30000)
}

function stopPolling() {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null }
  _unwatchFns.forEach(fn => fn()); _unwatchFns = []
}

function scheduleExpiry() {
  if (_ttlTimeout) clearTimeout(_ttlTimeout)
  _ttlTimeout = setTimeout(() => {
    if (_consumerCount === 0) stopPolling()
  }, CACHE_TTL_MS)
}

// The shared load function
let _pendingReload = false
async function loadCardsShared(address: string | undefined) {
  if (_shared.loading) {
    _pendingReload = true  // Queue a reload after current one finishes
    return
  }
  _shared.loading = true
  _pendingReload = false
  notifyListeners()
  try {
    const totalBig = await publicClient.readContract({
      address: ROUTER_ADDRESS, abi: ROUTER_ABI, functionName: 'totalCards',
    }) as bigint
    const total = Number(totalBig)
    if (total === 0) {
      _shared.cards = []
      _shared.lastLoadTime = Date.now()
      _shared.loading = false
      notifyListeners()
      return
    }

    // Batch: first get all token addresses in parallel (chunks of 20)
    const CHUNK = 20
    const tokenAddrs: (`0x${string}` | null)[] = new Array(total).fill(null)
    for (let start = 0; start < total; start += CHUNK) {
      const end = Math.min(start + CHUNK, total)
      const batch = Array.from({ length: end - start }, (_, j) =>
        publicClient.readContract({
          address: ROUTER_ADDRESS, abi: ROUTER_ABI, functionName: 'cardToken', args: [BigInt(start + j)],
        }).catch(() => null)
      )
      const results = await Promise.all(batch)
      results.forEach((addr, j) => { tokenAddrs[start + j] = addr as `0x${string}` | null })
    }

    // Now load card data in parallel chunks
    const cardData: CardState[] = []
    for (let start = 0; start < total; start += CHUNK) {
      const end = Math.min(start + CHUNK, total)
      const batch = Array.from({ length: end - start }, async (_, j) => {
        const i = start + j
        const tokenAddr = tokenAddrs[i]
        if (!tokenAddr) return null
        try {
          const [name, symbol, owner, price, reserves, uri] = await Promise.all([
            publicClient.readContract({ address: tokenAddr, abi: CARD_TOKEN_ABI, functionName: 'name' }),
            publicClient.readContract({ address: tokenAddr, abi: CARD_TOKEN_ABI, functionName: 'symbol' }),
            publicClient.readContract({ address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'ownerOfCard', args: [BigInt(i)] }),
            publicClient.readContract({ address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, functionName: 'getPrice', args: [BigInt(i)] }),
            publicClient.readContract({ address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, functionName: 'getReserves', args: [BigInt(i)] }),
            publicClient.readContract({ address: BIDNFT_ADDRESS, abi: BIDNFT_ABI, functionName: 'tokenURI', args: [BigInt(i)] }).catch(() => ''),
          ])
          let myStake = '0', myShares = '0', myBalance = '0'
          if (address) {
            const [eff, shares, b] = await Promise.all([
              publicClient.readContract({ address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'effectiveBalance', args: [BigInt(i), address as `0x${string}`] }),
              publicClient.readContract({ address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'userCardShares', args: [BigInt(i), address as `0x${string}`] }),
              publicClient.readContract({ address: tokenAddr, abi: CARD_TOKEN_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] }),
            ])
            myStake = formatEther(eff as bigint)   // actual token value
            myShares = formatEther(shares as bigint) // raw shares for tx calls
            myBalance = formatEther(b as bigint)
          }
          const [wavesR, cardsR] = reserves as [bigint, bigint]
          return {
            id: i, name: name as string, symbol: symbol as string, uri: uri as string, address: tokenAddr,
            owner: owner as string, price: formatEther(price as bigint),
            wavesReserve: formatEther(wavesR), cardReserve: formatEther(cardsR), myStake, myShares, myBalance,
          } as CardState
        } catch { return null }
      })
      const results = await Promise.all(batch)
      results.forEach(r => { if (r) cardData.push(r) })

      // Progressive update on first load
      if (_shared.cards.length === 0 && cardData.length > 0) {
        _shared.cards = [...cardData]
        notifyListeners()
      }
    }
    _shared.cards = cardData

    // Fetch WETH pool reserves (public, no address needed)
    try {
      const wethPoolRes = await publicClient.readContract({
        address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, functionName: 'getWethReserves',
      }) as [bigint, bigint]
      _shared.wethPoolWaves = formatEther(wethPoolRes[0])
      _shared.wethPoolWeth = formatEther(wethPoolRes[1])
    } catch { /* ignore */ }

    if (address) {
      try {
        const [wb, wethb, ws, pg, eb, cw] = await Promise.all([
          publicClient.readContract({ address: WAVES_ADDRESS, abi: WAVES_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] }),
          publicClient.readContract({ address: WETH_ADDRESS, abi: WETH_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] }),
          publicClient.readContract({ address: WETH_POOL_ADDRESS, abi: WETH_POOL_ABI, functionName: 'userWethShares', args: [address as `0x${string}`] }),
          publicClient.readContract({ address: GLOBAL_REWARDS_ADDRESS, abi: GLOBAL_REWARDS_ABI, functionName: 'pendingGlobalRewards', args: [address as `0x${string}`] }),
          publicClient.getBalance({ address: address as `0x${string}` }),
          publicClient.readContract({ address: WETH_POOL_ADDRESS, abi: WETH_POOL_ABI, functionName: 'claimableWethPool', args: [address as `0x${string}`] }),
        ])
        _shared.ethBalance = formatEther(eb)
        _shared.wavesBalance = formatEther(wb as bigint)
        _shared.wethBalance = formatEther(wethb as bigint)
        _shared.myWethShares = formatEther(ws as bigint)
        _shared.myWethStake = formatEther(ws as bigint) // backward compat
        const cwResult = cw as [bigint, bigint]
        _shared.claimableWeth = formatEther(cwResult[0])
        _shared.claimableWaves = formatEther(cwResult[1])
        _shared.pendingGlobal = formatEther(pg as bigint)
      } catch { /* ignore */ }
    }

    _shared.lastAddress = address
    _shared.lastLoadTime = Date.now()
  } catch (e) {
    console.error('loadCards error:', e)
  }
  _shared.loading = false
  notifyListeners()

  // If a reload was requested while we were loading, run it now
  if (_pendingReload) {
    _pendingReload = false
    loadCardsShared(_currentAddress)
  }
}

let logCounter = 0

export function useWhirlpool() {
  const { address, isConnected } = useAccount()
  const { connect: connectFn } = useConnect()
  const { disconnect: disconnectFn } = useDisconnect()
  const { writeContractAsync } = useWriteContract()

  // Local state synced from shared cache
  const [, forceUpdate] = useState(0)
  const [selectedCard, setSelectedCard] = useState(0)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastCreatedCard, setLastCreatedCard] = useState<{ name: string; symbol: string; hash: string; editorData?: any } | null>(null)

  // Shared cache accessors
  const cards = _shared.cards
  const wavesBalance = _shared.wavesBalance
  const ethBalance = _shared.ethBalance
  const wethBalance = _shared.wethBalance
  const wethPoolWaves = _shared.wethPoolWaves
  const wethPoolWeth = _shared.wethPoolWeth
  const myWethShares = _shared.myWethShares
  const claimableWeth = _shared.claimableWeth
  const claimableWaves = _shared.claimableWaves
  const myWethStake = _shared.myWethStake
  const pendingGlobal = _shared.pendingGlobal

  const addLog = useCallback((message: string, type: LogType = 'default', extra: Partial<LogEntry> = {}) => {
    const entry: LogEntry = {
      id: ++logCounter,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type, message, category: extra.category || 'other', ...extra,
    }
    setLogs(prev => [...prev, entry].slice(-500))
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  // Subscribe to shared state changes
  useEffect(() => {
    const listener = () => forceUpdate(v => v + 1)
    _listeners.add(listener)
    _consumerCount++
    if (_ttlTimeout) { clearTimeout(_ttlTimeout); _ttlTimeout = null }
    return () => {
      _listeners.delete(listener)
      _consumerCount--
      if (_consumerCount === 0) scheduleExpiry()
    }
  }, [])

  const loadCards = useCallback(async () => {
    await loadCardsShared(address)
  }, [address])

  const ensureApproval = async (token: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
    const allowance = await publicClient.readContract({
      address: token, abi: CARD_TOKEN_ABI, functionName: 'allowance', args: [address!, spender],
    }) as bigint
    console.log('[Approval] allowance:', allowance.toString(), 'need:', amount.toString(), 'skip:', allowance >= amount)
    if (allowance < amount) {
      addLog(`Approving ${spender.slice(0, 10)}...`, 'info')
      try {
        const hash = await writeContractAsync({ address: token, abi: CARD_TOKEN_ABI, functionName: 'approve', args: [spender, maxUint256] })
        await publicClient.waitForTransactionReceipt({ hash })
        addLog(`✓ Approval confirmed`, 'success')
      } catch (e: any) {
        // "already imported" = tx is already in Anvil's pool, re-check allowance
        if (e?.message?.includes('already imported') || e?.shortMessage?.includes('already imported')) {
          addLog(`⚠ Approval tx already in pool, re-checking allowance...`, 'info')
          await new Promise(r => setTimeout(r, 1000))
          const recheck = await publicClient.readContract({
            address: token, abi: CARD_TOKEN_ABI, functionName: 'allowance', args: [address!, spender],
          }) as bigint
          if (recheck >= amount) {
            addLog(`✓ Allowance confirmed on recheck`, 'success')
            return
          }
          throw e // still no allowance, rethrow
        }
        throw e
      }
    }
  }

  const createCard = async (name: string, symbol: string, uri?: string, editorData?: any) => {
    if (!isConnected) return
    setLoading(true)
    try {
      addLog(`Creating card "${name}" (${symbol})...`, 'info')
      const hash = await writeContractAsync({
        address: ROUTER_ADDRESS, abi: ROUTER_ABI, functionName: 'createCard',
        args: [name, symbol, uri || ''], value: parseEther('0.05'),
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Card created! Block #${receipt.blockNumber}`, 'success', { hash })
      setLastCreatedCard({ name, symbol, hash, editorData })
      // Cache editor data in localStorage so staking/swap pages can use it
      if (editorData) {
        try {
          const cache = JSON.parse(localStorage.getItem('mintedCardData') || '{}')
          cache[name.toLowerCase()] = editorData
          localStorage.setItem('mintedCardData', JSON.stringify(cache))
        } catch {}
      }
      setLoading(false)
      // Refresh card list in background (don't block UI)
      loadCards().catch(() => {})
    } catch (e: any) {
      addLog(`✗ Create: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
    }
  }

  const swap = async (tokenIn: string, tokenOut: string, amount: string, source: 'wallet' | 'staked' = 'wallet') => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      const resolveToken = (key: string): `0x${string}` => {
        if (key === 'waves') return WAVES_ADDRESS
        if (key === 'weth') return WETH_ADDRESS
        // key is 'card-<id>' where id is the on-chain card index
        const id = parseInt(key.replace('card-', ''))
        const card = cards.find(c => c.id === id)
        if (!card) {
          addLog(`✗ Card #${id} not found in loaded cards (${cards.length} total)`, 'error')
          throw new Error(`Card #${id} not found`)
        }
        addLog(`Resolved card-${id} → ${card.name} (${card.address.slice(0,10)}...)`, 'info')
        return card.address
      }

      const isCardIn = tokenIn.startsWith('card-')
      const isCardOut = tokenOut.startsWith('card-')

      if (isCardIn && isCardOut && source === 'staked') {
        const fromId = parseInt(tokenIn.replace('card-', ''))
        const toId = parseInt(tokenOut.replace('card-', ''))
        addLog(`⚡ SwapStake ${amount} shares card #${fromId} → #${toId}...`, 'info')
        const hash = await writeContractAsync({
          address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'swapStake',
          args: [BigInt(fromId), BigInt(toId), amt],
        })
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        addLog(`✓ SwapStake confirmed · block #${receipt.blockNumber}`, 'success', { hash })
      } else {
        const addrIn = resolveToken(tokenIn)
        const addrOut = resolveToken(tokenOut)
        console.log('[Swap] resolveToken done', { addrIn, addrOut, amt: amt.toString() })
        addLog(`Swapping ${amount} ${tokenIn} → ${tokenOut} (${addrIn.slice(0,10)} → ${addrOut.slice(0,10)})...`, 'info')
        // Check wallet balance of tokenIn
        try {
          const bal = await publicClient.readContract({ address: addrIn, abi: WAVES_ABI, functionName: 'balanceOf', args: [_currentAddress as `0x${string}`] })
          console.log('[Swap] wallet balance of tokenIn:', formatEther(bal as bigint), 'need:', amount)
        } catch (e) { console.log('[Swap] balance check failed', e) }
        console.log('[Swap] ensuring approval...')
        await ensureApproval(addrIn, SURFSWAP_ADDRESS, amt)
        console.log('[Swap] approval done, calling swapExact...')
        addLog(`Approval confirmed, sending swapExact...`, 'info')
        const hash = await writeContractAsync({
          address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, functionName: 'swapExact',
          args: [addrIn, addrOut, amt, BigInt(0)],
        })
        console.log('[Swap] tx hash:', hash)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        console.log('[Swap] receipt:', receipt.status)
        addLog(`✓ Swap confirmed · block #${receipt.blockNumber}`, 'success')
      }
      await loadCards()
    } catch (e: any) {
      addLog(`✗ Swap: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
      throw e
    }
    setLoading(false)
  }

  const stake = async (cardId: number, amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      const card = cards.find(c => c.id === cardId)
      addLog(`Staking ${amount} ${card?.symbol || '?'}...`, 'info')
      if (card) await ensureApproval(card.address, WHIRLPOOL_ADDRESS, amt)
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'stake', args: [BigInt(cardId), amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Staked · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) {
      addLog(`✗ Stake: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
      throw e
    }
    setLoading(false)
  }

  const unstake = async (cardId: number, amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      addLog(`Unstaking ${amount} from card #${cardId}...`, 'info')
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'unstake', args: [BigInt(cardId), amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Unstaked · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) {
      addLog(`✗ Unstake: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
      throw e
    }
    setLoading(false)
  }

  const swapStake = async (fromCard: number, toCard: number, shares: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(shares)
      addLog(`SwapStake ${shares} shares #${fromCard} → #${toCard}...`, 'info')
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'swapStake',
        args: [BigInt(fromCard), BigInt(toCard), amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ SwapStake confirmed · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) {
      addLog(`✗ SwapStake: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
      throw e
    }
    setLoading(false)
  }

  const batchSwapStake = async (fromCardIds: number[], toCard: number) => {
    if (!isConnected) return
    setLoading(true)
    try {
      addLog(`BatchSwapStake ${fromCardIds.length} cards → #${toCard}...`, 'info')
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'batchSwapStake',
        args: [fromCardIds.map(BigInt), BigInt(toCard)],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ BatchSwapStake confirmed · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) {
      addLog(`✗ BatchSwapStake: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
      throw e
    }
    setLoading(false)
  }

  const claimRewards = async (cardId?: number) => {
    if (!isConnected) return
    setLoading(true)
    try {
      if (cardId !== undefined) {
        addLog(`Claiming rewards for card #${cardId}...`, 'info')
        const hash = await writeContractAsync({
          address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'claimRewards',
          args: [BigInt(cardId)],
        })
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        addLog(`✓ Rewards claimed · block #${receipt.blockNumber}`, 'success')
      } else {
        // Claim all — iterate staked cards
        const staked = cards.filter(c => parseFloat(c.myStake) > 0)
        for (const c of staked) {
          addLog(`Claiming rewards for ${c.name}...`, 'info')
          const hash = await writeContractAsync({
            address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'claimRewards',
            args: [BigInt(c.id)],
          })
          await publicClient.waitForTransactionReceipt({ hash })
        }
        addLog(`✓ All rewards claimed (${staked.length} cards)`, 'success')
      }
      await loadCards()
    } catch (e: any) { addLog(`✗ Claim: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const wrapEth = async (amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      addLog(`Wrapping ${amount} ETH → WETH...`, 'info')
      const hash = await writeContractAsync({
        address: WETH_ADDRESS, abi: WETH_ABI, functionName: 'deposit',
        value: parseEther(amount),
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Wrapped · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) { addLog(`✗ Wrap: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const stakeWETH = async (amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      addLog(`Staking ${amount} WETH...`, 'info')
      await ensureApproval(WETH_ADDRESS, WETH_POOL_ADDRESS, amt)
      const hash = await writeContractAsync({
        address: WETH_POOL_ADDRESS, abi: WETH_POOL_ABI, functionName: 'stakeWETH', args: [amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ WETH Staked · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) {
      addLog(`✗ WETH Stake: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
      throw e
    }
    setLoading(false)
  }

  const unstakeWETH = async (amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      addLog(`Unstaking ${amount} WETH...`, 'info')
      const hash = await writeContractAsync({
        address: WETH_POOL_ADDRESS, abi: WETH_POOL_ABI, functionName: 'unstakeWETH', args: [amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ WETH Unstaked · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) {
      addLog(`✗ WETH Unstake: ${e.shortMessage || e.message}`, 'error', { category: 'error' })
      setLoading(false)
      throw e
    }
    setLoading(false)
  }

  const connect = () => {
    try {
      connectFn({ connector: injected() })
    } catch { addLog('No wallet provider available', 'error') }
  }

  const disconnect = () => {
    try { disconnectFn() } catch { /* */ }
  }

  // Init: load from cache or fetch, start polling
  useEffect(() => {
    addLog('═══ ERC-1142 · Whirlpool Terminal ═══', 'system', { category: 'system' })
    addLog(`RPC: http://192.168.0.82:8545 · Chain 31337`, 'system', { category: 'system' })

    const cacheAge = Date.now() - _shared.lastLoadTime
    const addressChanged = _shared.lastAddress !== address

    if (_shared.cards.length > 0 && cacheAge < CACHE_TTL_MS && !addressChanged) {
      addLog(`♻ Using cached cards (${_shared.cards.length} cards, ${Math.round(cacheAge / 1000)}s old)`, 'system', { category: 'system' })
    } else {
      loadCards()
    }

    _currentAddress = address
    startPolling()

    // Watch on-chain events for real-time updates (shared — only one set of watchers)
    if (_unwatchFns.length === 0) {
      const reload = () => loadCardsShared(_currentAddress)
      // Whirlpool events
      _unwatchFns.push(publicClient.watchContractEvent({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, eventName: 'OwnerChanged',
        onLogs: reload,
      }))
      _unwatchFns.push(publicClient.watchContractEvent({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, eventName: 'Staked',
        onLogs: reload,
      }))
      _unwatchFns.push(publicClient.watchContractEvent({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, eventName: 'Unstaked',
        onLogs: reload,
      }))
      // SurfSwap events
      _unwatchFns.push(publicClient.watchContractEvent({
        address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, eventName: 'Swap',
        onLogs: reload,
      }))
    }

    return () => {
      // Don't stop polling on unmount — let the TTL handle it
    }
  }, [address])

  const getCardEvents = async (cardId: number, limit = 10) => {
    try {
      const [stakeLogs, unstakeLogs, ownerLogs] = await Promise.all([
        publicClient.getLogs({
          address: WHIRLPOOL_ADDRESS, event: { type: 'event', name: 'Staked', inputs: [{ name: 'cardId', type: 'uint256', indexed: true }, { name: 'user', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }] },
          args: { cardId: BigInt(cardId) }, fromBlock: 0n,
        }),
        publicClient.getLogs({
          address: WHIRLPOOL_ADDRESS, event: { type: 'event', name: 'Unstaked', inputs: [{ name: 'cardId', type: 'uint256', indexed: true }, { name: 'user', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }] },
          args: { cardId: BigInt(cardId) }, fromBlock: 0n,
        }),
        publicClient.getLogs({
          address: WHIRLPOOL_ADDRESS, event: { type: 'event', name: 'OwnerChanged', inputs: [{ name: 'cardId', type: 'uint256', indexed: true }, { name: 'previousOwner', type: 'address', indexed: true }, { name: 'newOwner', type: 'address', indexed: true }] },
          args: { cardId: BigInt(cardId) }, fromBlock: 0n,
        }),
      ])
      const all = [
        ...stakeLogs.map(l => ({ type: 'stake' as const, block: l.blockNumber, args: l.args as any })),
        ...unstakeLogs.map(l => ({ type: 'unstake' as const, block: l.blockNumber, args: l.args as any })),
        ...ownerLogs.map(l => ({ type: 'ownership' as const, block: l.blockNumber, args: l.args as any })),
      ].sort((a, b) => Number(b.block - a.block)).slice(0, limit)
      return all
    } catch { return [] }
  }

  return {
    cards, selectedCard, setSelectedCard,
    ethBalance, wavesBalance, wethBalance, wethPoolWaves, wethPoolWeth, myWethShares, myWethStake, claimableWeth, claimableWaves, pendingGlobal,
    isConnected, address, loading, logs,
    createCard, swap, stake, unstake, swapStake, batchSwapStake, lastCreatedCard, clearLastCreated: () => setLastCreatedCard(null),
    claimRewards, wrapEth, stakeWETH, unstakeWETH, connect, disconnect, clearLogs, getCardEvents,
    loadCards,
  }
}
