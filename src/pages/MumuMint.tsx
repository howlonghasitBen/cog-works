/** MumuMint — Mumu Frens v2 Mint Page */
import { useState, useEffect, useMemo } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, zeroAddress, zeroHash } from 'viem'
import { mainnet } from 'wagmi/chains'

const CONTRACT_ADDRESS = '0x0B202E6232F976D5a78A731cD621b82199F3D1be' as const
const PRICE_PER_MINT = 0.025
const MAX_SUPPLY = 100

const MUMU_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'auth',
        type: 'tuple',
        components: [
          { name: 'key', type: 'bytes32' },
          { name: 'proof', type: 'bytes32[]' },
        ],
      },
      { name: 'quantity', type: 'uint256' },
      { name: 'affiliate', type: 'address' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'invites',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [
      { name: 'price', type: 'uint128' },
      { name: 'start', type: 'uint32' },
      { name: 'end', type: 'uint32' },
      { name: 'limit', type: 'uint32' },
      { name: 'maxSupply', type: 'uint32' },
      { name: 'unitSize', type: 'uint32' },
      { name: 'tokenAddress', type: 'address' },
      { name: 'isBlacklist', type: 'bool' },
    ],
  },
] as const

interface MumuImage {
  file: string
  name?: string
}

export default function MumuMint() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [quantity, setQuantity] = useState(1)
  const [images, setImages] = useState<MumuImage[]>([])

  // Load image manifest
  useEffect(() => {
    fetch('/images/mumuFrensv2Images/manifest.json')
      .then(r => r.json())
      .then((data: MumuImage[]) => setImages(data))
      .catch(() => {
        // Fallback: generate list from 1-100
        const fallback = Array.from({ length: 100 }, (_, i) => ({
          file: `${i + 1}.png`,
          name: `Mumu #${i + 1}`,
        }))
        setImages(fallback)
      })
  }, [])

  // Read total supply
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MUMU_ABI,
    functionName: 'totalSupply',
    chainId: mainnet.id,
  })

  // Mint
  const { writeContract, data: txHash, isPending: isMinting, error: mintError, reset: resetMint } = useWriteContract()

  // Wait for tx
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Refetch supply after confirmed
  useEffect(() => {
    if (isConfirmed) refetchSupply()
  }, [isConfirmed, refetchSupply])

  const totalPrice = useMemo(() => (quantity * PRICE_PER_MINT).toFixed(4), [quantity])
  const supply = totalSupply !== undefined ? Number(totalSupply) : null
  const soldOut = supply !== null && supply >= MAX_SUPPLY

  const handleMint = () => {
    if (!isConnected || soldOut) return
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MUMU_ABI,
      functionName: 'mint',
      args: [
        { key: zeroHash, proof: [] },
        BigInt(quantity),
        zeroAddress,
        '0x',
      ],
      value: parseEther(String(quantity * PRICE_PER_MINT)),
      chainId: mainnet.id,
    })
  }

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
          Mumu Frens v2 — Mint
        </h1>
        <span style={{
          fontSize: 13, fontFamily: "'DM Mono', monospace",
          color: '#7a7d8a',
        }}>
          {supply !== null ? `${supply} / ${MAX_SUPPLY} minted` : 'Loading...'}
        </span>
      </div>

      {/* Mint Section */}
      <div style={{
        background: '#1a1d2e', border: '2px solid #2a2d40',
        borderRadius: 4, padding: 24, marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: 520,
      }}>
        {/* Supply Bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            height: 8, background: '#2a2d40', borderRadius: 4, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: supply !== null ? `${(supply / MAX_SUPPLY) * 100}%` : '0%',
              background: 'linear-gradient(90deg, #c8a55a, #e8c97a)',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 6, fontSize: 11, color: '#7a7d8a',
            fontFamily: "'DM Mono', monospace",
          }}>
            <span>{supply ?? '?'} minted</span>
            <span>{MAX_SUPPLY} max</span>
          </div>
        </div>

        {/* Quantity Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <span style={{ color: '#9a9daa', fontSize: 14, fontFamily: "'DM Mono', monospace" }}>Qty:</span>
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            style={{
              width: 36, height: 36, background: '#2a2d40', border: '1px solid #4a4d5a',
              color: '#d0d0d0', fontSize: 18, cursor: 'pointer', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >−</button>
          <span style={{
            color: '#fff', fontSize: 20, fontWeight: 700, minWidth: 30, textAlign: 'center',
            fontFamily: "'Inter Tight', sans-serif",
          }}>{quantity}</span>
          <button
            onClick={() => setQuantity(q => Math.min(10, q + 1))}
            style={{
              width: 36, height: 36, background: '#2a2d40', border: '1px solid #4a4d5a',
              color: '#d0d0d0', fontSize: 18, cursor: 'pointer', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
          <span style={{
            marginLeft: 'auto', color: '#c8a55a', fontSize: 16, fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
          }}>
            {totalPrice} ETH
          </span>
        </div>

        {/* Mint / Connect Button */}
        {!isConnected ? (
          <button
            onClick={() => connect({ connector: injected() })}
            style={{
              width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
              border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', borderRadius: 2, letterSpacing: '0.05em',
              fontFamily: "'Inter Tight', sans-serif",
            }}
          >
            Connect Wallet to Mint
          </button>
        ) : isConfirmed ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4ade80', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              🎉 Minted!
            </div>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', fontSize: 13, fontFamily: "'DM Mono', monospace" }}
            >
              View on Etherscan →
            </a>
            <button
              onClick={() => { resetMint(); setQuantity(1) }}
              style={{
                display: 'block', margin: '12px auto 0', padding: '8px 20px',
                background: '#2a2d40', border: '1px solid #4a4d5a', color: '#d0d0d0',
                fontSize: 13, cursor: 'pointer', borderRadius: 2,
              }}
            >
              Mint More
            </button>
          </div>
        ) : (
          <button
            onClick={handleMint}
            disabled={isMinting || isConfirming || soldOut}
            style={{
              width: '100%', padding: '14px 0',
              background: soldOut ? '#4a4d5a' : 'linear-gradient(135deg, #c8a55a, #e8c97a)',
              border: 'none', color: soldOut ? '#7a7d8a' : '#1a1d2e',
              fontSize: 15, fontWeight: 700,
              cursor: soldOut || isMinting || isConfirming ? 'not-allowed' : 'pointer',
              borderRadius: 2, letterSpacing: '0.05em',
              fontFamily: "'Inter Tight', sans-serif",
              opacity: isMinting || isConfirming ? 0.7 : 1,
            }}
          >
            {soldOut ? 'Sold Out' : isMinting ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : `Mint ${quantity} for ${totalPrice} ETH`}
          </button>
        )}

        {/* Error */}
        {mintError && (
          <div style={{
            marginTop: 12, padding: '8px 12px', background: '#2d1a1a',
            border: '1px solid #5a2a2a', borderRadius: 2,
            color: '#f87171', fontSize: 12, fontFamily: "'DM Mono', monospace",
            wordBreak: 'break-all',
          }}>
            {(mintError as any)?.shortMessage || mintError.message}
          </div>
        )}

        {/* Connected address */}
        {isConnected && (
          <div style={{
            marginTop: 12, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 11, color: '#7a7d8a',
            fontFamily: "'DM Mono', monospace",
          }}>
            <span>{address?.slice(0, 6)}…{address?.slice(-4)}</span>
            <button
              onClick={() => disconnect()}
              style={{
                background: 'none', border: 'none', color: '#7a7d8a',
                cursor: 'pointer', fontSize: 11, textDecoration: 'underline',
              }}
            >disconnect</button>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: '#c8a55a',
        fontFamily: "'Cinzel', serif", marginBottom: 12,
        letterSpacing: '0.05em',
      }}>
        Collection Preview
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 8,
      }}>
        {images.map((img, i) => (
          <div
            key={i}
            style={{
              background: '#1a1d2e', border: '1px solid #2a2d40',
              borderRadius: 4, overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8a55a')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d40')}
          >
            <img
              src={`/images/mumuFrensv2Images/${img.file}`}
              alt={img.name || `Mumu #${i + 1}`}
              loading="lazy"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              padding: '6px 8px', fontSize: 11, color: '#9a9daa',
              fontFamily: "'DM Mono', monospace",
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {img.name || `#${i + 1}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
