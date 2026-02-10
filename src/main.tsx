import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, base, localhost } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'

const config = createConfig({
  chains: [mainnet, base, localhost],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
