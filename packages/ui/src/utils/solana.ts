import type { ChainVM, RelayChain } from '@reservoir0x/relay-sdk'
import type { LinkedWallet } from '../types/index.js'

export const solanaAddressRegex = /^(?!bc1)[1-9A-HJ-NP-Za-km-z]{32,44}$/
export const solana = {
  id: 792703809
}
export const eclipse = {
  id: 9286185
}
export const eclipseWallets = ['nightly', 'backpack']

export function isSolanaAddress(address: string): boolean {
  return solanaAddressRegex.test(address)
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
    (chain.id === eclipse.id &&
      currentWallet &&
      !eclipseWallets.includes(currentWallet.connector.toLowerCase()))
  ) {
    const supportedWallet = linkedWallets.find(
      (wallet) =>
        wallet.vmType === chain.vmType &&
        (chain.id === eclipse.id
          ? eclipseWallets.includes(wallet.connector.toLowerCase())
          : true)
    )

    return supportedWallet?.address
  }
  return undefined
}
