'use client'

import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { RelayKitProvider } from './providers'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Relay Kit Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience seamless cross-chain swaps with optimal rates and multi-chain support
          </p>
        </header>

        <div className="max-w-xl mx-auto mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
            <RelayKitProvider>
              <SwapWidget
                defaultFromToken={{
                  chainId: 1,
                  address: '0x0000000000000000000000000000000000000000',
                  decimals: 18,
                  name: 'ETH',
                  symbol: 'ETH',
                  logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
                }}
              />
            </RelayKitProvider>
          </div>
        </div>

        <section className="mt-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transform transition-all hover:scale-105">
              <div className="mb-4">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Multi-Chain Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Seamlessly swap tokens across multiple blockchain networks with built-in security
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transform transition-all hover:scale-105">
              <div className="mb-4">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Best Rates</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Automatically find and execute trades at the most optimal rates across DEXs
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transform transition-all hover:scale-105">
              <div className="mb-4">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">User-Friendly</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simple and intuitive interface designed for a smooth swapping experience
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
