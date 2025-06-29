"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const supportedChains = [
    { id: 8453, name: 'Base' },
    { id: 1891, name: 'Lisk' },
    { id: 42220, name: 'Celo' }
  ];

  const isSupportedChain = supportedChains.some(supportedChain => 
    supportedChain.id === chainId
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <ConnectButton 
        chainStatus="icon"
        showBalance={false}
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
      
      {isConnected && !isSupportedChain && (
        <div className="bg-orange-50 p-2 rounded text-orange-700 text-xs text-center">
          <div className="font-semibold">⚠️ Switch to supported network</div>
          <div className="flex gap-1 mt-1">
            {supportedChains.map((supportedChain) => (
              <button
                key={supportedChain.id}
                onClick={() => {
                  // TODO: Implement network switching
                  console.log('Switch to:', supportedChain.name);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs"
              >
                {supportedChain.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isConnected && isSupportedChain && (
        <div className="bg-green-50 p-2 rounded text-green-700 text-xs text-center">
          <div className="font-semibold">✅ {supportedChains.find(c => c.id === chainId)?.name}</div>
          <div className="text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
        </div>
      )}
    </div>
  );
} 