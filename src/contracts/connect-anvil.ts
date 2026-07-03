import { connect, getAccount, switchChain } from '@wagmi/core'
import { injected } from 'wagmi/connectors'
import { config, anvilChain } from './wagmi-config'
import { getMetaMaskAnvilRpcUrl } from './anvil-rpc'

const connector = injected()

function anvilAddChainParams() {
  return {
    chainName: anvilChain.name,
    nativeCurrency: anvilChain.nativeCurrency,
    rpcUrls: [getMetaMaskAnvilRpcUrl()],
  }
}

/** Ensure MetaMask is connected and on the local Anvil network (31337). */
export async function ensureAnvilChain(): Promise<void> {
  const account = getAccount(config)
  if (!account.isConnected) {
    await connect(config, { connector, chainId: anvilChain.id })
  }

  const current = getAccount(config)
  if (current.chainId !== anvilChain.id) {
    await switchChain(config, {
      connector,
      chainId: anvilChain.id,
      addEthereumChainParameter: anvilAddChainParams(),
    })
  }
}

/** @deprecated alias */
export const connectAnvilWallet = ensureAnvilChain
