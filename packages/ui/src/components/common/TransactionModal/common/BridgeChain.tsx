import { RelayChain } from '@reservoir0x/relay-sdk'
import { FC } from 'react'
import { ChainIcon, Flex, Text } from '../../../primitives'

type BridgeChainProps = {
  chain: RelayChain
}

export const BridgeChain: FC<BridgeChainProps> = ({ chain }) => {
  return (
    <Flex align="center" css={{ gap: '2', cursor: 'pointer' }}>
      <ChainIcon chainId={chain.id} css={{ height: 20, width: 20 }} />
      <Text style="subtitle1" ellipsify>
        {chain.displayName}
      </Text>
    </Flex>
  )
}
