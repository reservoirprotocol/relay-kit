'use client'

import { RelayKitProvider as BaseRelayKitProvider } from '@reservoir0x/relay-kit-ui'
import { PropsWithChildren } from 'react'

const theme = {
  borderRadius: {
    small: '0.375rem',
    medium: '0.5rem',
    large: '0.75rem',
  },
  font: {
    family: 'Inter, sans-serif',
  },
  colors: {
    primary: '#4F46E5',
    secondary: '#6366F1',
    accent: '#818CF8',
    background: '#FFFFFF',
    foreground: '#1F2937',
    border: '#E5E7EB',
    muted: '#9CA3AF',
    success: '#10B981',
    error: '#EF4444',
  },
}

const chains = [
  {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  {
    id: 56,
    name: 'BSC',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  {
    id: 10,
    name: 'Optimism',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 42161,
    name: 'Arbitrum',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
]

export function RelayKitProvider({ children }: PropsWithChildren) {
  return (
    <BaseRelayKitProvider
      chains={chains}
      theme={theme}
      onAnalyticEvent={(eventName, data) => {
        console.log('Analytic Event', eventName, data)
      }}
    >
      {children}
    </BaseRelayKitProvider>
  )
}
