import type { Chain } from 'viem'

export type RelayChain = {
  id: number
  name: string
  displayName: string
  httpRpcUrl?: string
  wsRpcUrl?: string
  explorerUrl?: string
  icon?: {
    dark?: string
    light?: string
  }
  currency?: {
    symbol?: string
    name?: string
    decimals?: number
  }
  depositEnabled?: boolean
  viemChain?: Chain
}
