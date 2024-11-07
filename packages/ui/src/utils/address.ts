import {
  getDeadAddress,
  type ChainVM,
  type RelayChain
} from '@reservoir0x/relay-sdk'
import { isAddress } from 'viem'
import { isBitcoinAddress } from '../utils/bitcoin.js'
import {
  eclipse,
  eclipseWallets,
  isSolanaAddress,
  solana
} from '../utils/solana.js'
import type { LinkedWallet } from '../types/index.js'

export const isValidAddress = (
  vmType?: ChainVM,
  address?: string,
  chainId?: number,
  connector?: string
) => {
  if (address) {
    if (vmType === 'evm' || !vmType) {
      return isAddress(address)
    } else if (vmType === 'svm') {
      if (chainId && connector) {
        if (
          chainId === eclipse.id &&
          !eclipseWallets.includes(connector.toLowerCase())
        ) {
          return false
        }
        if (
          chainId === solana.id &&
          eclipseWallets.includes(connector.toLowerCase())
        ) {
          return false
        }
      }
      //tood solana
      return isSolanaAddress(address)
    } else if (vmType === 'bvm') {
      return isBitcoinAddress(address)
    }
  }
  return false
}

export const addressWithFallback = (
  vmType?: ChainVM,
  address?: string,
  chainId?: number,
  connector?: string
) => {
  return address && isValidAddress(vmType ?? 'evm', address, chainId, connector)
    ? address
    : getDeadAddress(vmType, chainId)
}

export function findSupportedWallet(
  chain: RelayChain,
  currentAddress: string | undefined,
  linkedWallets: LinkedWallet[]
): string | undefined {
  const currentWallet = linkedWallets.find(
    (wallet) => wallet.address === currentAddress
  )
  if (
    currentWallet?.vmType !== chain.vmType ||
    (currentWallet &&
      !isValidAddress(
        chain.vmType,
        currentWallet.address,
        chain.id,
        currentWallet.connector
      ))
  ) {
    const supportedWallet = linkedWallets.find((wallet) =>
      isValidAddress(chain.vmType, wallet.address, chain.id, wallet.connector)
    )
    return supportedWallet?.address
  }
  return undefined
}
