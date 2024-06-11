import type { RelayTransaction } from './RelayTransaction.js'
import type { BridgeFee } from './BridgeFee.js'

type Token = {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI: string
}

export type { Token, RelayTransaction, BridgeFee }
