/** Anvil JSON-RPC URL — same host as the page, port 8545. Override with VITE_ANVIL_RPC_URL. */
export function getAnvilRpcUrl(): string {
  const envUrl = import.meta.env.VITE_ANVIL_RPC_URL
  if (typeof envUrl === 'string' && envUrl.length > 0) return envUrl
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8545`
  }
  return 'http://127.0.0.1:8545'
}

/** RPC URL for MetaMask's network config — wallet runs locally, so use localhost. */
export function getMetaMaskAnvilRpcUrl(): string {
  const envUrl = import.meta.env.VITE_ANVIL_RPC_URL
  if (typeof envUrl === 'string' && envUrl.length > 0) return envUrl
  return 'http://127.0.0.1:8545'
}
