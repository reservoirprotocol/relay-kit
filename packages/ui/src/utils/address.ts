import { getDeadAddress, type ChainVM } from '@reservoir0x/relay-sdk'
import { isAddress } from 'viem'
import { isBitcoinAddress } from '../utils/bitcoin.js'
import { isSolanaAddress } from '../utils/solana.js'

export const isValidAddress = (vmType?: ChainVM, address?: string) => {
  if (address) {
    if (vmType === 'evm' || !vmType) {
      return isAddress(address)
    } else if (vmType === 'svm') {
      return isSolanaAddress(address)
    } else if (vmType === 'bvm') {
      return isBitcoinAddress(address)
    }
  }
  return false
}

export const addressWithFallback = (vmType?: ChainVM, address?: string) => {
  return address && isValidAddress(vmType ?? 'evm', address)
    ? address
    : getDeadAddress(vmType)
}
