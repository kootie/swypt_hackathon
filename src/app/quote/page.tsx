"use client";
import React, { useState } from "react";
import WalletConnect from '@/components/WalletConnect';

const networks = ["Base", "Lisk", "Celo"];
const tokens = ["USDC", "USDT"];

interface Quote {
  rate: number;
  fee: number;
  total: number;
}

export default function QuotePage() {
  const [network, setNetwork] = useState(networks[0]);
  const [token, setToken] = useState(tokens[0]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  const getQuote = async () => {
    setLoading(true);
    // TODO: Replace with actual API call
    setTimeout(() => {
      setQuote({
        rate: 1,
        fee: 0.03 * Number(amount),
        total: Number(amount) * 1.03,
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
      {/* Connect Wallet Button */}
      <div className="absolute top-6 right-8">
        <WalletConnect />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Get a Quote</h2>
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-900">Network</label>
          <select value={network} onChange={e => setNetwork(e.target.value)} className="w-full p-2 border rounded text-gray-900">
            {networks.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-900">Token</label>
          <select value={token} onChange={e => setToken(e.target.value)} className="w-full p-2 border rounded text-gray-900">
            {tokens.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-900">Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded text-gray-900" />
        </div>
        <button onClick={getQuote} disabled={loading || !amount} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mb-4">
          {loading ? "Getting Quote..." : "Get Quote"}
        </button>
        {quote && (
          <div className="bg-blue-50 p-4 rounded mb-4 text-gray-900">
            <div>Rate: {quote.rate}</div>
            <div>Fee: {quote.fee} {token}</div>
            <div>Total: {quote.total} {token}</div>
          </div>
        )}
        {quote && (
          <a href="/transfer" className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded">Proceed to Transfer</a>
        )}
      </div>
    </div>
  );
} 