import type { ChainVM } from '@reservoir0x/relay-sdk'
import type { LinkedWallet } from '../types/index.js'

export const solanaAddressRegex = /^(?!bc1)[1-9A-HJ-NP-Za-km-z]{32,44}$/
export const solana = {
  id: 792703809
}

export function isSolanaAddress(address: string): boolean {
  return solanaAddressRegex.test(address)
}

export function findSupportedWallet(
  vmType: ChainVM | undefined,
  currentAddress: string | undefined,
  linkedWallets: LinkedWallet[]
): string | undefined {
  const currentWallet = linkedWallets.find(
    (wallet) => wallet.address === currentAddress
  )
  if (currentWallet?.vmType !== vmType) {
    const supportedWallet = linkedWallets.find(
      (wallet) => wallet.vmType === vmType
    )
    return supportedWallet?.address
  }
  return undefined
}
