import type { RelayTransaction } from './RelayTransaction.js'
import type { BridgeFee } from './BridgeFee.js'
import type { ChainVM } from '@relayprotocol/relay-sdk'
import type { FiatCurrency } from './Fiat.js'

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
  connector: string
  walletLogoUrl?: string
}

export type { Token, RelayTransaction, BridgeFee, LinkedWallet, FiatCurrency }
