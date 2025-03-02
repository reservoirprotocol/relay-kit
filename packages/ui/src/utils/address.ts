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
import type { RelayKitProviderProps } from '../providers/RelayKitProvider.js'
import { isTronAddress } from './tron.js'

export const isValidAddress = (
  vmType?: ChainVM,
  address?: string,
  chainId?: number,
  connector?: string,
  connectorKeyOverrides?: RelayKitProviderProps['options']['vmConnectorKeyOverrides']
) => {
  let eclipseConnectorKeys: string[] | undefined = undefined
  if (connectorKeyOverrides && connectorKeyOverrides[eclipse.id]) {
    eclipseConnectorKeys = connectorKeyOverrides[eclipse.id]
  } else if (vmType === 'svm') {
    eclipseConnectorKeys = eclipseWallets
  }

  if (address) {
    if (vmType === 'evm' || !vmType) {
      return isAddress(address)
    } else if (vmType === 'svm') {
      if (chainId && connector) {
        if (
          chainId === eclipse.id &&
          !eclipseConnectorKeys!.includes(connector.toLowerCase())
        ) {
          return false
        }
        if (
          chainId === solana.id &&
          eclipseConnectorKeys!.includes(connector.toLowerCase())
        ) {
          return false
        }
      }

      return isSolanaAddress(address)
    } else if (vmType === 'bvm') {
      return isBitcoinAddress(address)
    } else if (vmType === 'tvm') {
      return isTronAddress(address)
    }
  }
  return false
}

export const addressWithFallback = (
  vmType?: ChainVM,
  address?: string,
  chainId?: number,
  connector?: string,
  connectorKeyOverrides?: Parameters<typeof isValidAddress>['4']
) => {
  return address &&
    isValidAddress(
      vmType ?? 'evm',
      address,
      chainId,
      connector,
      connectorKeyOverrides
    )
    ? address
    : getDeadAddress(vmType, chainId)
}

export function findSupportedWallet(
  chain: RelayChain,
  currentAddress: string | undefined,
  linkedWallets: LinkedWallet[],
  connectorKeyOverrides?: Parameters<typeof isValidAddress>['4']
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
        currentWallet.connector,
        connectorKeyOverrides
      ))
  ) {
    const supportedWallet = linkedWallets.find((wallet) =>
      isValidAddress(
        chain.vmType,
        wallet.address,
        chain.id,
        wallet.connector,
        connectorKeyOverrides
      )
    )
    return supportedWallet?.address
  }
  return undefined
}
