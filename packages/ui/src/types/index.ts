import type { RelayTransaction } from './RelayTransaction.js'
import type { BridgeFee } from './BridgeFee.js'
import type { ChainVM } from '@reservoir0x/relay-sdk'

type Token = {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI: string
  verified?: boolean
}

type LinkedWallet = {
  address: string
  vmType: ChainVM
  walletLogoUrl?: string
}

export type { Token, RelayTransaction, BridgeFee, LinkedWallet }
