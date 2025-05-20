"use client"

import { type ReactNode } from "react";
import { CryptoProvider } from "swypt-checkout";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CryptoProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </CryptoProvider>
  );
} 