import type { Chain } from 'viem'
import type { paths } from '../types/index.js'

type Erc20Currencies = NonNullable<
  paths['/chains']['get']['responses']['200']['content']['application/json']['chains']
>['0']['erc20Currencies']

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
    squaredDark?: string
    squaredLight?: string
  }
  currency?: {
    id?: string
    symbol?: string
    name?: string
    decimals?: number
    supportsBridging?: boolean
  }
  depositEnabled?: boolean
  blockProductionLagging?: boolean
  erc20Currencies?: Erc20Currencies
  iconUrl?: string | null
  logoUrl?: string | null
  brandColor?: string | null
  viemChain: Chain
}
