"use client";
import React, { useState } from "react";
import { useAccount, useChainId } from 'wagmi';
import WalletConnect from '@/components/WalletConnect';

const transferTypes = ["Onramp (M-Pesa → Crypto)", "Offramp (Crypto → M-Pesa)"];

const supportedChains = [
  { id: 8453, name: 'Base' },
  { id: 1891, name: 'Lisk' },
  { id: 42220, name: 'Celo' }
];

export default function TransferPage() {
  const [type, setType] = useState(transferTypes[0]);
  const [details, setDetails] = useState({ amount: "", phone: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const handleTransfer = async () => {
    if (!isConnected) {
      setStatus("Please connect your wallet first!");
      return;
    }
    
    if (!supportedChains.some(supportedChain => supportedChain.id === chainId)) {
      setStatus("Please switch to a supported network (Base, Lisk, or Celo)!");
      return;
    }
    
    setLoading(true);
    setStatus("");
    // TODO: Replace with actual transfer logic
    setTimeout(() => {
      setStatus("Transfer successful!");
      setLoading(false);
    }, 1500);
  };

  const requiresWallet = type === transferTypes[1]; // Offramp requires wallet
  const isSupportedChain = supportedChains.some(supportedChain => supportedChain.id === chainId);
  const currentChain = supportedChains.find(supportedChain => supportedChain.id === chainId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
      {/* Wallet Connect Component */}
      <div className="absolute top-6 right-8">
        <WalletConnect />
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Transfer</h2>
        
        {/* Wallet Connection Status */}
        {isConnected && isSupportedChain && (
          <div className="bg-green-50 p-4 rounded mb-4 text-green-700 text-center">
            <div className="font-semibold">Wallet Connected</div>
            <div className="text-sm">{currentChain?.name}</div>
            <div className="text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
          </div>
        )}
        
        {/* Wallet Required Warning */}
        {requiresWallet && !isConnected && (
          <div className="bg-orange-50 p-4 rounded mb-4 text-orange-700 text-center">
            <div className="font-semibold">⚠️ Wallet Required</div>
            <div className="text-sm">Please connect your wallet to proceed with this transfer.</div>
          </div>
        )}
        
        {/* Network Warning */}
        {isConnected && !isSupportedChain && (
          <div className="bg-orange-50 p-4 rounded mb-4 text-orange-700 text-center">
            <div className="font-semibold">⚠️ Unsupported Network</div>
            <div className="text-sm">Please switch to Base, Lisk, or Celo network.</div>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-900">Transfer Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 border rounded text-gray-900">
            {transferTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-900">Amount</label>
          <input type="number" value={details.amount} onChange={e => setDetails({ ...details, amount: e.target.value })} className="w-full p-2 border rounded text-gray-900" />
        </div>
        
        {/* Phone Number Field - Required for both Onramp and Offramp */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-900">
            {type === transferTypes[0] ? "M-Pesa Phone Number (Sender)" : "M-Pesa Phone Number (Recipient)"}
          </label>
          <input 
            type="text" 
            value={details.phone} 
            onChange={e => setDetails({ ...details, phone: e.target.value })} 
            className="w-full p-2 border rounded text-gray-900" 
            placeholder="e.g., 254700000000"
          />
        </div>
        
        <button 
          onClick={handleTransfer} 
          disabled={loading || !details.amount || !details.phone || (requiresWallet && !isConnected) || (isConnected && !isSupportedChain)} 
          className={`w-full font-semibold py-2 px-4 rounded mb-4 ${
            loading || !details.amount || !details.phone || (requiresWallet && !isConnected) || (isConnected && !isSupportedChain)
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {loading ? "Processing..." : 
           requiresWallet && !isConnected ? "Connect Wallet First" : 
           isConnected && !isSupportedChain ? "Switch Network First" : 
           !details.phone ? "Enter Phone Number" :
           "Initiate Transfer"}
        </button>
        {status && (
          <div className={`p-4 rounded text-center font-semibold ${
            status.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
} 