export const SOL = {
  groupID: 'SOL',
  chainId: 792703809,
  decimals: 9,
  address: '11111111111111111111111111111111',
  name: 'SOL',
  symbol: 'SOL',
  metadata: {
    isNative: true,
    logoURI:
      'https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756',
    verified: true
  }
}

export type Currency = {
  id?: string
  address?: string
  decimals: number
  name: string
  symbol: string
}
