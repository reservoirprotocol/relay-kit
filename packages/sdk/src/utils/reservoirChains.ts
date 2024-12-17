import { Chain } from 'viem'
import { calderaTestnet } from './customChains'

export type ReservoirChain = Chain & {
  lightIconUrl?: string
  darkIconUrl?: string
  reservoirBaseUrl?: string
  proxyApi?: string
  collectionSetId?: string
  community?: string
}

export const reservoirChains: ReservoirChain[] = [
  {
    ...calderaTestnet,
    reservoirBaseUrl: 'https://api-creator-testnet.reservoir.tools'
  }
]
