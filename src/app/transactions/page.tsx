"use client";
import React from "react";
import WalletConnect from '@/components/WalletConnect';

const mockTransactions = [
  {
    id: 1,
    type: "Onramp",
    amount: "100 USDC",
    network: "Base",
    status: "Completed",
    date: "2024-06-01 14:23",
  },
  {
    id: 2,
    type: "Offramp",
    amount: "50 USDT",
    network: "Lisk",
    status: "Pending",
    date: "2024-06-02 09:10",
  },
  {
    id: 3,
    type: "Onramp",
    amount: "200 USDC",
    network: "Celo",
    status: "Failed",
    date: "2024-06-03 17:45",
  },
];

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
      {/* Connect Wallet Button */}
      <div className="absolute top-6 right-8">
        <WalletConnect />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Transaction History</h2>
        <table className="w-full text-left border-collapse text-gray-900">
          <thead>
            <tr>
              <th className="py-2 px-3 border-b text-gray-900">Type</th>
              <th className="py-2 px-3 border-b text-gray-900">Amount</th>
              <th className="py-2 px-3 border-b text-gray-900">Network</th>
              <th className="py-2 px-3 border-b text-gray-900">Status</th>
              <th className="py-2 px-3 border-b text-gray-900">Date</th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-blue-50">
                <td className="py-2 px-3 border-b text-gray-900">{tx.type}</td>
                <td className="py-2 px-3 border-b text-gray-900">{tx.amount}</td>
                <td className="py-2 px-3 border-b text-gray-900">{tx.network}</td>
                <td className={`py-2 px-3 border-b font-semibold text-gray-900 ${tx.status === 'Completed' ? 'text-green-600' : tx.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'}`}>{tx.status}</td>
                <td className="py-2 px-3 border-b text-gray-900">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 