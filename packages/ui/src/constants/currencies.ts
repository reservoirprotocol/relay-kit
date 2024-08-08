export const SolanaCurrencies = [
  [
    {
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
  ],
  [
    {
      groupID: 'WSOL',
      chainId: 792703809,
      decimals: 9,
      address: 'So11111111111111111111111111111111111111112',
      name: 'Wrapped SOL',
      symbol: 'WSOL',
      metadata: {
        isNative: false,
        logoURI:
          'https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f536f31313131313131313131313131313131313131313131313131313131313131313131313131313131322f6c6f676f2e706e67',
        verified: true
      }
    }
  ]
]

export type Currency = {
  id?: string
  address?: string
  decimals: number
  name: string
  symbol: string
}
