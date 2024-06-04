import React, { type FC } from 'react'
import { Flex, Text, ChainTokenIcon } from '../../../primitives'
import { type Token } from '../../../../types'

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
