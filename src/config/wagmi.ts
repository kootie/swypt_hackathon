import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, celo } from 'wagmi/chains';

// Lisk chain configuration (custom)
const lisk = {
  id: 1891,
  name: 'Lisk',
  network: 'lisk',
  nativeCurrency: {
    decimals: 18,
    name: 'LSK',
    symbol: 'LSK',
  },
  rpcUrls: {
    public: { http: ['https://rpc.api.lisk.com'] },
    default: { http: ['https://rpc.api.lisk.com'] },
  },
  blockExplorers: {
    etherscan: { name: 'Lisk Explorer', url: 'https://explorer.lisk.com' },
    default: { name: 'Lisk Explorer', url: 'https://explorer.lisk.com' },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'Swypt Bridge',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // You'll need to get this from WalletConnect
  chains: [base, lisk, celo],
  ssr: true,
}); 