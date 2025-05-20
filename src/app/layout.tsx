"use client"

import React, { type ReactNode } from "react";
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
  return (
    <CryptoProvider>
      <html lang="en">
        <head>
          <Script
            src="https://cdn.swypt.io/checkout.js"
            strategy="beforeInteractive"
            onLoad={() => {
              console.log('SwyptCheckout script loaded successfully');
              // Set a global flag to indicate script is loaded
              window.SwyptCheckoutLoaded = true;
            }}
            onError={(e) => {
              console.error('Error loading SwyptCheckout script:', e);
              window.SwyptCheckoutLoaded = false;
            }}
          />
        </head>
        <body>{children}</body>
      </html>
    </CryptoProvider>
  );
} 