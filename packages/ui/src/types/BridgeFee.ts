import type { RelayChain } from '@reservoir0x/relay-sdk'

export type BridgeFee = {
  raw: bigint
  formatted: string
  usd: string
  name: string
  tooltip: string | null
  type: 'gas' | 'relayer'
  currency: RelayChain['currency']
  id: string
}
