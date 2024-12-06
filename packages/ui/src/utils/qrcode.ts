import type { ChainVM } from '@reservoir0x/relay-sdk'
import { solana } from './solana.js'

export const generateQrWalletDeeplink = (
  vm?: ChainVM,
  amount: string = '0',
  toAddress?: string,
  chainId?: number
) => {
  if (vm === 'evm') {
    return `ethereum:${toAddress}@${chainId}?value=${amount}`
  } else if (vm === 'svm') {
    if (chainId === solana.id) {
      return `solana:${toAddress}?amount=${amount}`
    }
  } else if (vm === 'bvm') {
    return `bitcoin:${toAddress}?amount=${amount}`
  }
  return undefined
}
