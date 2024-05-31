import { FC } from 'react'
import { Flex, Text } from '../../../primitives'
import { Token } from '../../../../lib/types'
import { ChainTokenIcon } from '../../../primitives/ChainTokenIcon'

type SwapTokenProps = {
  token: Token
}

export const SwapToken: FC<SwapTokenProps> = ({ token }) => {
  return (
    <Flex align="center" css={{ gap: '2', cursor: 'pointer' }}>
      <ChainTokenIcon
        chainId={token.chainId}
        tokenlogoURI={token.logoURI}
        css={{ height: 20, width: 20 }}
      />
      <Text style="subtitle1" ellipsify>
        {token.symbol}
      </Text>
    </Flex>
  )
}
