import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { getAnvilRpcUrl } from './anvil-rpc';

const anvilRpcUrl = getAnvilRpcUrl();

// Anvil local testnet as custom chain
export const anvilChain = {
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [anvilRpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Local', url: anvilRpcUrl },
  },
} as const;

export const config = createConfig({
  chains: [anvilChain, mainnet],
  connectors: [
    injected(), // Rabby, MetaMask, etc.
  ],
  transports: {
    [anvilChain.id]: http(anvilRpcUrl),
    [mainnet.id]: http(),
  },
});
