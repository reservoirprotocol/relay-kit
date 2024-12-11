"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ArrowRightLeft, Globe, Zap, Shield, Wallet } from "lucide-react";
import { useState } from "react";
import type { SwapWidget as SwapWidgetType } from "@reservoir0x/relay-kit-ui";

type DynamicSwapWidgetProps = {
  onConnectWallet: () => void;
  onSwapComplete: () => void;
  onSwapError: (error: string) => void;
};

// Create a wrapper component to handle the widget
const WrappedSwapWidget: React.FC<DynamicSwapWidgetProps> = (props) => {
  const { SwapWidget } = require("@reservoir0x/relay-kit-ui") as {
    SwapWidget: React.ComponentType<DynamicSwapWidgetProps>;
  };
  return <SwapWidget {...props} />;
};

const DynamicSwapWidget = dynamic<DynamicSwapWidgetProps>(() => Promise.resolve(WrappedSwapWidget), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  ),
});

export default function Home() {
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Relay Kit Demo</h1>
          <p className="text-gray-300">Cross-chain bridging and swapping made easy</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Swap Widget Section */}
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <ArrowRightLeft className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold">Cross-Chain Swap</h2>
            </div>
            <DynamicSwapWidget
              onConnectWallet={() => {
                console.log("Connect wallet clicked");
              }}
              onSwapComplete={() => {
                console.log("Swap completed");
                setError(null);
              }}
              onSwapError={(error: string) => {
                console.error("Swap error:", error);
                setError(error);
              }}
            />
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="space-y-6">
            {/* Multi-Chain Support */}
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold">Multi-Chain Support</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Seamlessly swap assets across multiple blockchain networks:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">EVM</span>
                  <p className="text-sm text-gray-500">Ethereum Virtual Machine</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">SVM</span>
                  <p className="text-sm text-gray-500">Solana Virtual Machine</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">BVM</span>
                  <p className="text-sm text-gray-500">Bitcoin Virtual Machine</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">TVM</span>
                  <p className="text-sm text-gray-500">Tron Virtual Machine</p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold">Key Features</h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 mt-1" />
                  <div>
                    <h3 className="font-medium">Secure Cross-Chain Swaps</h3>
                    <p className="text-sm text-gray-600">
                      Execute swaps securely across different blockchain networks
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-indigo-600 mt-1" />
                  <div>
                    <h3 className="font-medium">Multi-Wallet Support</h3>
                    <p className="text-sm text-gray-600">
                      Connect and manage multiple wallets across different chains
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
