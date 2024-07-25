// This will eventually be returned in an api, but need to hardcode for now
export const CurrenciesMap = {
  eth: {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18
  },
  usdc: {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
  degen: {
    id: 'degen',
    symbol: 'DEGEN',
    name: 'Degen',
    decimals: 18
  },
  sipher: {
    id: 'sipher',
    symbol: 'SIPHER',
    name: 'Sipher',
    decimals: 18
  },
  xai: {
    id: 'xai',
    symbol: 'XAI',
    name: 'Xai',
    decimals: 18
  }
} as const

export type Currency = {
  id?: string
  address?: string
  decimals: number
  name: string
  symbol: string
}
