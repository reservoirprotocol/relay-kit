import { useMemo } from 'react'
import {
  NormalizedWalletName,
  WalletChainIncompatible,
  WalletChainRestricted
} from '../constants/walletCompatibility.js'
import type { LinkedWallet } from '../types/index.js'
import { isAddress } from 'viem'
import useIsAGW from './useIsAGW.js'

export default (
  chainId?: number,
  address?: string,
  wallets?: LinkedWallet[]
) => {
  const normalizedAddress =
    address && isAddress(address) ? address.toLowerCase() : address
  const linkedWallet = wallets?.find(
    (wallet) =>
      (wallet.vmType === 'evm'
        ? wallet.address.toLowerCase()
        : wallet.address) === normalizedAddress
  )
  const isRecipientAGW = useIsAGW(address, !linkedWallet)

  return useMemo(() => {
    if (!chainId || !address) {
      return true
    }

    if (!linkedWallet) {
      return isRecipientAGW ? chainId === 2741 : true
    }
    const normalizedWalletName =
      NormalizedWalletName[linkedWallet.connector] ?? linkedWallet.connector

    const incompatibleChains = WalletChainIncompatible[normalizedWalletName]
    if (incompatibleChains && incompatibleChains.includes(chainId)) {
      return false
    }

    const restrictedChains = WalletChainRestricted[normalizedWalletName]
    if (restrictedChains && !restrictedChains.includes(chainId)) {
      return false
    }

    return true
  }, [chainId, address, linkedWallet, isRecipientAGW])
}
