"use client"

import React, { type ReactNode, useEffect } from "react";
import { CryptoProvider } from "swypt-checkout";
import "./globals.css";
import Script from 'next/script';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, celo } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

declare global {
  interface Window {
    SwyptCheckout?: any;
    SwyptCheckoutLoaded?: boolean;
  }
}

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

const config = createConfig({
  chains: [base, lisk, celo],
  transports: {
    [base.id]: http(),
    [lisk.id]: http(),
    [celo.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    // Initialize SwyptCheckout when the script is loaded
    const initializeSwypt = () => {
      if (typeof window !== 'undefined' && window.SwyptCheckout) {
        window.SwyptCheckoutLoaded = true;
        console.log('SwyptCheckout initialized successfully');
      }
    };

    // Check if SwyptCheckout is already loaded
    if (window.SwyptCheckout) {
      initializeSwypt();
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.swypt.io/checkout.js"
          strategy="beforeInteractive"
          onLoad={() => {
            console.log('SwyptCheckout script loaded successfully');
            if (typeof window !== 'undefined') {
              window.SwyptCheckoutLoaded = true;
            }
          }}
          onError={(e) => {
            console.error('Error loading SwyptCheckout script:', e);
            if (typeof window !== 'undefined') {
              window.SwyptCheckoutLoaded = false;
            }
          }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider>
              <CryptoProvider>
                {children}
              </CryptoProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
} 