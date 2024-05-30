import React from 'react'
import type { ReactElement } from 'react'
import { Flex } from '../primitives'

type Props = {}

export function SwapWidget(props: Props): ReactElement {
  console.log(props)
  return (
    <Flex
      css={{
        background: 'primary1'
      }}
    >
      Swap Widget
    </Flex>
  )
}
