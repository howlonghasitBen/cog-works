import { useState, useEffect, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { createPublicClient, http, formatEther, parseEther, maxUint256 } from 'viem'
import type { LogEntry, LogType } from '../components/WhirlpoolTerminal'
import {
  WHIRLPOOL_ADDRESS, WAVES_ADDRESS, WETH_ADDRESS, SURFSWAP_ADDRESS, ROUTER_ADDRESS,
  WHIRLPOOL_ABI, WAVES_ABI, CARD_TOKEN_ABI, WETH_ABI, SURFSWAP_ABI, ROUTER_ABI,
} from '../contracts/erc1142'
import { anvilChain } from '../contracts/wagmi-config'

export interface CardState {
  id: number
  name: string
  symbol: string
  address: `0x${string}`
  owner: string
  price: string
  wavesReserve: string
  cardReserve: string
  myStake: string
  myBalance: string
}

const publicClient = createPublicClient({
  chain: anvilChain as any,
  transport: http('http://192.168.0.82:8545'),
})

let logCounter = 0

export function useWhirlpool() {
  const { address, isConnected } = useAccount()
  const { connect: connectFn } = useConnect()
  const { disconnect: disconnectFn } = useDisconnect()
  const { writeContractAsync } = useWriteContract()

  const [cards, setCards] = useState<CardState[]>([])
  const [selectedCard, setSelectedCard] = useState(0)
  const [wavesBalance, setWavesBalance] = useState('0')
  const [wethBalance, setWethBalance] = useState('0')
  const [myWethStake, setMyWethStake] = useState('0')
  const [pendingGlobal, setPendingGlobal] = useState('0')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = useCallback((message: string, type: LogType = 'default', extra: Partial<LogEntry> = {}) => {
    const entry: LogEntry = {
      id: ++logCounter,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type, message, category: extra.category || 'other', ...extra,
    }
    setLogs(prev => [...prev, entry].slice(-500))
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  const loadCards = useCallback(async () => {
    try {
      const totalBig = await publicClient.readContract({
        address: ROUTER_ADDRESS, abi: ROUTER_ABI, functionName: 'totalCards',
      }) as bigint
      const total = Number(totalBig)
      const cardData: CardState[] = []

      for (let i = 0; i < total; i++) {
        try {
          const tokenAddr = await publicClient.readContract({
            address: ROUTER_ADDRESS, abi: ROUTER_ABI, functionName: 'cardToken', args: [BigInt(i)],
          }) as `0x${string}`

          const [name, symbol, owner, price, reserves] = await Promise.all([
            publicClient.readContract({ address: tokenAddr, abi: CARD_TOKEN_ABI, functionName: 'name' }),
            publicClient.readContract({ address: tokenAddr, abi: CARD_TOKEN_ABI, functionName: 'symbol' }),
            publicClient.readContract({ address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'ownerOfCard', args: [BigInt(i)] }),
            publicClient.readContract({ address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, functionName: 'getPrice', args: [BigInt(i)] }),
            publicClient.readContract({ address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, functionName: 'getReserves', args: [BigInt(i)] }),
          ])

          let myStake = '0', myBalance = '0'
          if (address) {
            const [s, b] = await Promise.all([
              publicClient.readContract({ address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'stakeOf', args: [BigInt(i), address] }),
              publicClient.readContract({ address: tokenAddr, abi: CARD_TOKEN_ABI, functionName: 'balanceOf', args: [address] }),
            ])
            myStake = formatEther(s as bigint)
            myBalance = formatEther(b as bigint)
          }

          const [wavesR, cardsR] = reserves as [bigint, bigint]
          cardData.push({
            id: i, name: name as string, symbol: symbol as string, address: tokenAddr,
            owner: owner as string, price: formatEther(price as bigint),
            wavesReserve: formatEther(wavesR), cardReserve: formatEther(cardsR), myStake, myBalance,
          })
        } catch (e: any) {
          addLog(`⚠ Error loading card ${i}: ${e.shortMessage || e.message}`, 'error')
        }
      }
      setCards(cardData)

      if (address) {
        try {
          const [wb, wethb, ws, pg] = await Promise.all([
            publicClient.readContract({ address: WAVES_ADDRESS, abi: WAVES_ABI, functionName: 'balanceOf', args: [address] }),
            publicClient.readContract({ address: WETH_ADDRESS, abi: WETH_ABI, functionName: 'balanceOf', args: [address] }),
            publicClient.readContract({ address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'userWethStake', args: [address] }),
            publicClient.readContract({ address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'pendingGlobalRewards', args: [address] }),
          ])
          setWavesBalance(formatEther(wb as bigint))
          setWethBalance(formatEther(wethb as bigint))
          setMyWethStake(formatEther(ws as bigint))
          setPendingGlobal(formatEther(pg as bigint))
        } catch { /* ignore */ }
      }
    } catch (e: any) {
      addLog(`⚠ Error loading cards: ${e.shortMessage || e.message}`, 'error')
    }
  }, [address, addLog])

  const ensureApproval = async (token: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
    const allowance = await publicClient.readContract({
      address: token, abi: CARD_TOKEN_ABI, functionName: 'allowance', args: [address!, spender],
    }) as bigint
    if (allowance < amount) {
      addLog(`Approving ${spender.slice(0, 10)}...`, 'info')
      const hash = await writeContractAsync({ address: token, abi: CARD_TOKEN_ABI, functionName: 'approve', args: [spender, maxUint256] })
      await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Approval confirmed`, 'success')
    }
  }

  const createCard = async (name: string, symbol: string, uri?: string) => {
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
      await loadCards()
    } catch (e: any) { addLog(`✗ Create: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const swap = async (tokenIn: string, tokenOut: string, amount: string, source: 'wallet' | 'staked' = 'wallet') => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      const resolveToken = (key: string): `0x${string}` => {
        if (key === 'waves') return WAVES_ADDRESS
        if (key === 'weth') return WETH_ADDRESS
        const idx = parseInt(key.replace('card-', ''))
        return cards[idx]?.address || ('0x0' as `0x${string}`)
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
        addLog(`Swapping ${amount} ${tokenIn} → ${tokenOut}...`, 'info')
        await ensureApproval(addrIn, SURFSWAP_ADDRESS, amt)
        const hash = await writeContractAsync({
          address: SURFSWAP_ADDRESS, abi: SURFSWAP_ABI, functionName: 'swapExact',
          args: [addrIn, addrOut, amt, BigInt(0)],
        })
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        addLog(`✓ Swap confirmed · block #${receipt.blockNumber}`, 'success')
      }
      await loadCards()
    } catch (e: any) { addLog(`✗ Swap: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const stake = async (cardId: number, amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      const card = cards[cardId]
      addLog(`Staking ${amount} ${card?.symbol || '?'}...`, 'info')
      if (card) await ensureApproval(card.address, WHIRLPOOL_ADDRESS, amt)
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'stake', args: [BigInt(cardId), amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Staked · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) { addLog(`✗ Stake: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
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
    } catch (e: any) { addLog(`✗ Unstake: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
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
    } catch (e: any) { addLog(`✗ SwapStake: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const stakeWETH = async (amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      addLog(`Staking ${amount} WETH...`, 'info')
      await ensureApproval(WETH_ADDRESS, WHIRLPOOL_ADDRESS, amt)
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'stakeWETH', args: [amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ WETH staked · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) { addLog(`✗ WETH stake: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const unstakeWETH = async (amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      addLog(`Unstaking ${amount} WETH...`, 'info')
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'unstakeWETH', args: [amt],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ WETH unstaked · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) { addLog(`✗ WETH unstake: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const claimRewards = async (cardId: number) => {
    if (!isConnected) return
    setLoading(true)
    try {
      addLog(`Claiming rewards for card #${cardId}...`, 'info')
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'claimRewards', args: [BigInt(cardId)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Rewards claimed`, 'success')
      await loadCards()
    } catch (e: any) { addLog(`✗ Claim: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const claimWETHRewards = async () => {
    if (!isConnected) return
    setLoading(true)
    try {
      addLog(`Claiming WETH rewards...`, 'info')
      const hash = await writeContractAsync({
        address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, functionName: 'claimWETHRewards',
      })
      await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ WETH rewards claimed`, 'success')
      await loadCards()
    } catch (e: any) { addLog(`✗ Claim: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
    setLoading(false)
  }

  const wrapETH = async (amount: string) => {
    if (!isConnected) return
    setLoading(true)
    try {
      const amt = parseEther(amount)
      addLog(`Wrapping ${amount} ETH → WETH...`, 'info')
      const hash = await writeContractAsync({
        address: WETH_ADDRESS, abi: WETH_ABI, functionName: 'deposit', value: amt,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      addLog(`✓ Wrapped · block #${receipt.blockNumber}`, 'success')
      await loadCards()
    } catch (e: any) { addLog(`✗ Wrap: ${e.shortMessage || e.message}`, 'error', { category: 'error' }) }
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

  // Init + polling
  useEffect(() => {
    addLog('═══ ERC-1142 · Whirlpool Terminal ═══', 'system', { category: 'system' })
    addLog(`RPC: http://192.168.0.82:8545 · Chain 31337`, 'system', { category: 'system' })
    loadCards()
    const interval = setInterval(loadCards, 5000)
    return () => clearInterval(interval)
  }, [address])

  // Watch OwnerChanged events
  useEffect(() => {
    const unwatch = publicClient.watchContractEvent({
      address: WHIRLPOOL_ADDRESS, abi: WHIRLPOOL_ABI, eventName: 'OwnerChanged',
      onLogs: (eventLogs) => {
        for (const log of eventLogs) {
          const args = log.args as any
          addLog(`★ OWNERSHIP CHANGED card #${args.cardId} → ${args.newOwner?.slice(0, 12)}…`, 'ownership', { category: 'ownership' })
        }
        loadCards()
      },
    })
    return () => unwatch()
  }, [addLog, loadCards])

  return {
    cards, selectedCard, setSelectedCard,
    wavesBalance, wethBalance, myWethStake, pendingGlobal,
    isConnected, address, loading, logs,
    createCard, swap, stake, unstake, swapStake,
    stakeWETH, unstakeWETH, claimRewards, claimWETHRewards, wrapETH,
    connect, disconnect, clearLogs,
  }
}
