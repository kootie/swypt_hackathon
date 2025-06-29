"use client"

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Stablecoin to M-Pesa Bridge
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Seamlessly transfer between stablecoins and M-Pesa mobile money
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/payment"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Start Transfer
            </Link>
            <a 
              href="https://github.com/kootie/swypt_hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              View Source Code
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">💱</div>
            <h3 className="text-xl font-semibold mb-2">Multi-Chain Support</h3>
            <p className="text-gray-600">
              Support for Base, Lisk, and Celo networks with seamless cross-chain transfers
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">M-Pesa Integration</h3>
            <p className="text-gray-600">
              Direct integration with M-Pesa for instant mobile money transfers
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-purple-600 text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure & Fast</h3>
            <p className="text-gray-600">
              Built with Swypt APIs for secure, fast, and reliable transactions
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-center">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-600">Onramp (M-Pesa → Crypto)</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Enter amount and select stablecoin</li>
                <li>Receive M-Pesa STK push</li>
                <li>Confirm payment on your phone</li>
                <li>Receive crypto in your wallet</li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-600">Offramp (Crypto → M-Pesa)</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Connect your wallet</li>
                <li>Select amount to transfer</li>
                <li>Approve transaction</li>
                <li>Receive M-Pesa instantly</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 