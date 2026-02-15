/** MumuGallery — Collection gallery + mint sidebar for mumu-frens v2 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, zeroAddress, zeroHash } from 'viem'
import { mainnet } from 'wagmi/chains'
import { useToast } from '../components/Toast'

const CONTRACT_ADDRESS = '0x0B202E6232F976D5a78A731cD621b82199F3D1be' as const
const PRICE_PER_MINT = 0.025
const MAX_SUPPLY = 100

const MUMU_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'auth', type: 'tuple', components: [
        { name: 'key', type: 'bytes32' },
        { name: 'proof', type: 'bytes32[]' },
      ]},
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
] as const

interface MumuItem {
  file: string
  name?: string
  description?: string
  external_url?: string
  image?: string
  attributes?: Array<{ trait_type: string; value: string }>
}

export default function MumuGallery() {
  const [items, setItems] = useState<MumuItem[]>([])
  const [selected, setSelected] = useState<MumuItem | null>(null)
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Wallet
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  // Read total supply
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MUMU_ABI,
    functionName: 'totalSupply',
    chainId: mainnet.id,
    query: { refetchInterval: 15000 },
  })

  // Mint
  const { writeContract, data: txHash, isPending: isMinting, error: mintError, reset: resetMint } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const toast = useToast()
  const prevSupply = useRef<number | null>(null)
  const [barGlow, setBarGlow] = useState(false)

  const [showMintSuccess, setShowMintSuccess] = useState(false)
  useEffect(() => {
    if (isConfirmed) {
      refetchSupply()
      setShowMintSuccess(true)
    }
  }, [isConfirmed, refetchSupply])
  useEffect(() => { if (mintError) toast.error((mintError as any)?.shortMessage || mintError.message) }, [mintError])

  // Detect supply changes → pulse glow
  useEffect(() => {
    if (totalSupply === undefined) return
    const cur = Number(totalSupply)
    if (prevSupply.current !== null && cur !== prevSupply.current) {
      setBarGlow(true)
      const t = setTimeout(() => setBarGlow(false), 2000)
      return () => clearTimeout(t)
    }
    prevSupply.current = cur
  }, [totalSupply])

  const supply = totalSupply !== undefined ? Number(totalSupply) : null
  const soldOut = supply !== null && supply >= MAX_SUPPLY
  const totalPrice = (quantity * PRICE_PER_MINT).toFixed(4)

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

  // Load manifest
  useEffect(() => {
    fetch('/images/mumuFrensv2Images/manifest.json')
      .then(r => r.json())
      .then((data: MumuItem[]) => setItems(data))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.file || '').toLowerCase().includes(q) ||
      (m.attributes || []).some(a => a.value.toLowerCase().includes(q))
    )
  }, [search, items])

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
          Mumu Frens v2
        </h1>
        <span style={{
          fontSize: 13, fontFamily: "'DM Mono', monospace",
          color: '#7a7d8a',
        }}>
          {filtered.length} / {items.length}
        </span>
      </div>

      {/* Main layout: gallery (80%) + mint sidebar (20%) */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Gallery — 80% */}
        <div style={{ flex: '0 0 80%', minWidth: 0 }}>
          {/* Search */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by name or trait..."
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {filtered.map(item => (
              <div
                key={item.file}
                onClick={() => setSelected(item)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: `2px solid ${selected?.file === item.file ? '#c8a55a' : '#3a3d4a'}`,
                  background: 'linear-gradient(180deg, #2a2d3a, #1a1d2e)',
                  boxShadow: selected?.file === item.file
                    ? '0 0 15px rgba(200,165,90,0.3)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                  <img
                    src={`/images/mumuFrensv2Images/${item.file}`}
                    alt={item.name || item.file}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ padding: '6px 8px', borderTop: '1px solid #3a3d4a' }}>
                  <p style={{
                    margin: 0, fontSize: 11, fontWeight: 700,
                    color: '#d0d0d0', fontFamily: "'Cinzel', serif",
                    textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.name || item.file}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mint Sidebar — 20% */}
        <div style={{
          flex: '0 0 20%', minWidth: 220,
          position: 'sticky', top: 80,
          display: 'flex', flexDirection: 'column', gap: 16,
          justifyContent: 'center',
          height: 'calc(100vh - 120px)',
        }}>
          {/* Hero GIF */}
          <div style={{
            borderRadius: 6, overflow: 'hidden',
            border: '2px solid #3a3d4a',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <img
              src="/images/mumu-hero.gif"
              alt="Mumu Frens v2"
              style={{ width: '100%', display: 'block' }}
            />
          </div>

          {/* Mint Card */}
          <div style={{
            background: 'linear-gradient(180deg, #2a2d3a, #1a1d2e)',
            border: '2px solid #3a3d4a',
            borderRadius: 6, padding: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{
              margin: '0 0 12px', fontSize: 14, fontWeight: 800,
              fontFamily: "'Cinzel', serif", color: '#c8a55a',
              textAlign: 'center', letterSpacing: '0.08em',
            }}>
              MINT
            </h3>

            {/* Supply Bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                height: 6, background: '#2a2d40', borderRadius: 3, overflow: 'hidden',
                boxShadow: barGlow ? '0 0 12px rgba(200,165,90,0.6), 0 0 24px rgba(200,165,90,0.3)' : 'none',
                animation: barGlow ? 'supplyGlow 0.6s ease-in-out 3' : 'none',
                transition: 'box-shadow 0.3s ease',
              }}>
                <div style={{
                  height: '100%',
                  width: supply !== null ? `${(supply / MAX_SUPPLY) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, #c8a55a, #e8c97a)',
                  borderRadius: 3, transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 4, fontSize: 10, color: '#7a7d8a',
                fontFamily: "'DM Mono', monospace",
              }}>
                <span>{supply ?? '?'} minted</span>
                <span>{MAX_SUPPLY}</span>
              </div>
            </div>

            {/* Price */}
            <div style={{
              textAlign: 'center', marginBottom: 12,
              fontSize: 11, color: '#9a9daa',
              fontFamily: "'DM Mono', monospace",
            }}>
              {PRICE_PER_MINT} ETH each
            </div>

            {/* Quantity */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, marginBottom: 16,
            }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{
                  width: 32, height: 32, background: '#2a2d40', border: '1px solid #4a4d5a',
                  color: '#d0d0d0', fontSize: 16, cursor: 'pointer', borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >−</button>
              <span style={{
                color: '#fff', fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: 'center',
                fontFamily: "'Inter Tight', sans-serif",
              }}>{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                style={{
                  width: 32, height: 32, background: '#2a2d40', border: '1px solid #4a4d5a',
                  color: '#d0d0d0', fontSize: 16, cursor: 'pointer', borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            </div>

            {/* Total */}
            <div style={{
              textAlign: 'center', marginBottom: 16,
              color: '#c8a55a', fontSize: 16, fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
            }}>
              {totalPrice} ETH
            </div>

            {/* Mint / Connect */}
            {!isConnected ? (
              <button
                onClick={() => connect({ connector: injected() })}
                style={{
                  width: '100%', padding: '12px 0',
                  background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                  border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', borderRadius: 3, letterSpacing: '0.05em',
                  fontFamily: "'Inter Tight', sans-serif",
                }}
              >
                Connect Wallet
              </button>
            ) : isConfirmed ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4ade80', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                  🎉 Minted!
                </div>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
                >
                  View on Etherscan →
                </a>
                <button
                  onClick={() => { resetMint(); setQuantity(1) }}
                  style={{
                    display: 'block', margin: '10px auto 0', padding: '6px 16px',
                    background: '#2a2d40', border: '1px solid #4a4d5a', color: '#d0d0d0',
                    fontSize: 11, cursor: 'pointer', borderRadius: 2,
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
                  width: '100%', padding: '12px 0',
                  background: soldOut ? '#4a4d5a' : 'linear-gradient(135deg, #c8a55a, #e8c97a)',
                  border: 'none',
                  color: soldOut ? '#7a7d8a' : '#1a1d2e',
                  fontSize: 13, fontWeight: 700,
                  cursor: soldOut || isMinting || isConfirming ? 'not-allowed' : 'pointer',
                  borderRadius: 3, letterSpacing: '0.05em',
                  fontFamily: "'Inter Tight', sans-serif",
                  opacity: isMinting || isConfirming ? 0.7 : 1,
                }}
              >
                {soldOut ? 'Sold Out' : isMinting ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : `Mint ${quantity}`}
              </button>
            )}

            {/* Error */}
            {mintError && (
              <div style={{
                marginTop: 10, padding: '6px 10px', background: '#2d1a1a',
                border: '1px solid #5a2a2a', borderRadius: 2,
                color: '#f87171', fontSize: 10, fontFamily: "'DM Mono', monospace",
                wordBreak: 'break-all',
              }}>
                {(mintError as any)?.shortMessage || mintError.message}
              </div>
            )}

            {/* Connected address */}
            {isConnected && (
              <div style={{
                marginTop: 10, textAlign: 'center',
                fontSize: 10, color: '#6a6d7a',
                fontFamily: "'DM Mono', monospace",
              }}>
                {address?.slice(0, 6)}…{address?.slice(-4)}
                <button
                  onClick={() => disconnect()}
                  style={{
                    background: 'none', border: 'none', color: '#6a6d7a',
                    cursor: 'pointer', fontSize: 10, textDecoration: 'underline',
                    marginLeft: 8,
                  }}
                >disconnect</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 40,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex',
              maxWidth: 900, maxHeight: '85vh',
              border: '3px solid #c8a55a',
              borderRadius: 8, overflow: 'hidden',
              boxShadow: '0 0 40px rgba(200,165,90,0.3)',
              background: '#1a1d2e', cursor: 'default',
            }}
          >
            <div style={{ flex: '1 1 60%', minWidth: 0, display: 'flex', alignItems: 'center', background: '#111' }}>
              <img
                src={`/images/mumuFrensv2Images/${selected.file}`}
                alt={selected.name || selected.file}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <div style={{
              flex: '0 0 260px', padding: '24px 20px',
              borderLeft: '2px solid #3a3d4a',
              overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <h2 style={{
                margin: 0, fontSize: 18, fontWeight: 800,
                color: '#c8a55a', fontFamily: "'Cinzel', serif",
              }}>
                {selected.name || selected.file}
              </h2>
              {selected.description && (
                <p style={{
                  margin: 0, fontSize: 12, color: '#a0a3b0',
                  fontFamily: "'DM Mono', monospace",
                  lineHeight: 1.5, fontStyle: 'italic',
                }}>
                  {selected.description}
                </p>
              )}
              {selected.attributes && selected.attributes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h3 style={{
                    margin: 0, fontSize: 12, fontWeight: 700,
                    color: '#8a8d9a', fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    paddingBottom: 6, borderBottom: '1px solid #3a3d4a',
                  }}>
                    Attributes
                  </h3>
                  {selected.attributes.map((attr, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{
                        fontSize: 10, color: '#6a6d7a',
                        fontFamily: "'DM Mono', monospace",
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {attr.trait_type}
                      </span>
                      <span style={{
                        fontSize: 13, color: '#d0d0d0',
                        fontFamily: "'DM Mono', monospace",
                        padding: '4px 8px',
                        background: '#2a2d3a',
                        border: '1px solid #3a3d4a',
                        borderRadius: 2,
                      }}>
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginTop: 'auto', padding: '8px 16px',
                  background: '#2a2d3a', border: '1px solid #4a4d5a',
                  color: '#c8a55a', fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  cursor: 'pointer', borderRadius: 2,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#3a3d4a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2a2d3a')}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes supplyGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(200,165,90,0.3); }
          50% { box-shadow: 0 0 18px rgba(200,165,90,0.6), 0 0 30px rgba(200,165,90,0.3); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }
        @keyframes successPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Mint Success Modal */}
      {showMintSuccess && (
        <div
          onClick={() => { setShowMintSuccess(false); resetMint() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Confetti particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${Math.random() * 40}%`,
              left: `${Math.random() * 100}%`,
              width: 8, height: 8,
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              background: ['#c8a55a', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 7],
              animation: `confettiFall ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.8}s forwards`,
              opacity: 0.9,
            }} />
          ))}

          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1d2e, #22252f)',
              border: '2px solid #c8a55a',
              borderRadius: 12,
              padding: '32px 40px',
              maxWidth: 420,
              width: '90vw',
              textAlign: 'center',
              animation: 'fadeSlideUp 0.4s ease-out',
              boxShadow: '0 0 60px rgba(200,165,90,0.2), 0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Hero emoji */}
            <div style={{
              fontSize: 56,
              marginBottom: 12,
              animation: 'successPulse 2s ease-in-out infinite',
            }}>
              🐄✨
            </div>

            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 24,
              fontWeight: 900,
              color: '#c8a55a',
              margin: '0 0 8px',
            }}>
              Mint Successful!
            </h2>

            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#d0d0d0',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}>
              You minted <span style={{ color: '#c8a55a', fontWeight: 700 }}>{quantity}</span> Mumu Fren{quantity > 1 ? 's' : ''} v2!
            </p>

            {/* Mumu hero gif */}
            <div style={{
              margin: '0 auto 20px',
              width: 160, height: 160,
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid rgba(200,165,90,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <img
                src="/images/mumu-hero.gif"
                alt="Mumu Fren"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Supply update */}
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#6b7280',
              marginBottom: 16,
            }}>
              {supply ?? '?'} / {MAX_SUPPLY} minted
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    padding: '8px 16px',
                    border: '1px solid rgba(59,130,246,0.4)',
                    background: 'rgba(59,130,246,0.1)',
                    color: '#60a5fa',
                    borderRadius: 4,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  View on Etherscan ↗
                </a>
              )}
              <a
                href="https://opensea.io/collection/mumu-frens-v2"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  padding: '8px 16px',
                  border: '1px solid rgba(200,165,90,0.4)',
                  background: 'rgba(200,165,90,0.1)',
                  color: '#c8a55a',
                  borderRadius: 4,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                View on OpenSea ↗
              </a>
            </div>

            {/* Close hint */}
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#4a4d5a',
              marginTop: 20,
            }}>
              click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
