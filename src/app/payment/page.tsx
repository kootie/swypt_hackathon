"use client"

import React, { useState, useEffect } from "react";
import { DepositModal } from "swypt-checkout";
import "swypt-checkout/dist/styles.css";
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
}

declare global {
  interface Window {
    SwyptCheckout?: any;
    SwyptCheckoutLoaded?: boolean;
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [tokenType, setTokenType] = useState("USDT");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutReady, setIsCheckoutReady] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const MAX_INIT_ATTEMPTS = 5;

  // Initialize SwyptCheckout
  useEffect(() => {
    const initCheckout = async () => {
      try {
        // Wait for the script to load
        await new Promise((resolve) => {
          if (window.SwyptCheckoutLoaded) {
            resolve(true);
          } else {
            const checkInterval = setInterval(() => {
              if (window.SwyptCheckoutLoaded) {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 1000); // Check every second

            // Set a timeout to prevent infinite waiting
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve(false);
            }, 10000); // 10 second timeout
          }
        });

        // Check if SwyptCheckout is available
        if (typeof window !== 'undefined' && window.SwyptCheckout) {
          setIsCheckoutReady(true);
          console.log('SwyptCheckout initialized successfully');
        } else {
          throw new Error("SwyptCheckout is not available");
        }
      } catch (err) {
        console.error('Error initializing SwyptCheckout:', err);
        if (initAttempts < MAX_INIT_ATTEMPTS) {
          setInitAttempts(prev => prev + 1);
          setTimeout(initCheckout, 2000); // Retry after 2 seconds
        } else {
          setError("Failed to initialize payment system. Please refresh the page and try again.");
        }
      }
    };

    initCheckout();
  }, [initAttempts]);

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const handlePayment = async (paymentData: unknown) => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          tokenType,
          mpesaPhone,
          paymentData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Payment processed successfully!");
        setAmount("");
        setMpesaPhone("");
        loadTransactions();
      } else {
        setError(data.error || "Payment failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Payment error:", err);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !mpesaPhone) {
      setError("Please fill in all required fields");
      return;
    }
    if (!isCheckoutReady) {
      setError("Payment system is not ready. Please try again later.");
      return;
    }
    setIsOpen(true);
  };

  if (!isCheckoutReady) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Loading Payment System</h1>
            <p className="text-gray-600">Please wait while we initialize the payment system...</p>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {initAttempts > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Attempt {initAttempts} of {MAX_INIT_ATTEMPTS}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Make a Payment</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700">
                  Token Type
                </label>
                <select
                  id="tokenType"
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="USDT">Tether (USDT)</option>
                  <option value="USDC">USD Coin (USDC)</option>
                  <option value="CELO">Celo Dollar (CELO)</option>
                </select>
              </div>

              <div>
                <label htmlFor="mpesaPhone" className="block text-sm font-medium text-gray-700">
                  M-PESA Phone Number
                </label>
                <input
                  type="tel"
                  id="mpesaPhone"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., 254712345678"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Proceed to Payment"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-50 p-4 rounded-md border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.amount.toFixed(2)} {transaction.type}
                        </p>
                        <p
                          className={`text-sm ${
                            transaction.status === "completed"
                              ? "text-green-600"
                              : transaction.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsOpen(false)} />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <DepositModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                headerBackgroundColor="linear-gradient(to right, #044639, #044639, #FF4040)"
                businessName="Swypt Demo"
                merchantName="Demo Merchant"
                merchantAddress="0x6d19a24D93379D1bA58d28884fFBBEf1bc145387"
                amount={parseFloat(amount)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 