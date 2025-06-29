"use client"

import React, { type ReactNode, useEffect } from "react";
import { CryptoProvider } from "swypt-checkout";
import "./globals.css";
import Script from 'next/script';

declare global {
  interface Window {
    SwyptCheckout?: any;
    SwyptCheckoutLoaded?: boolean;
  }
}

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
    <CryptoProvider>
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
        <body>{children}</body>
      </html>
    </CryptoProvider>
  );
} 