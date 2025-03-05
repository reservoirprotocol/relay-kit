export const WalletChainRestricted: Record<string, number[]> = {
  phantom: [1, 8453, 792703809, 137, 8253038, 101, 10143, 10],
  backpack: [1, 8453, 137, 42161, 10, 10143, 80094, 9286185, 792703809],
  magiceden: [1, 137, 8453, 33139, 8253038, 792703809]
}

export const WalletChainIncompatible: Record<string, number[]> = {
  binance: [7777777, 8453],
  binanceus: [7777777, 8453]
}

export const NormalizedWalletName: Record<string, string> = {
  phantomevm: 'phantom',
  magicedensol: 'magiceden'
}
