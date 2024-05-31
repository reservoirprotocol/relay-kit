import React from 'react'
import type { ReactElement } from 'react'
import { Flex } from '../primitives'
import { css } from '@reservoir0x/relay-design-system/css'

type Props = {}

export function SwapWidget(props: Props): ReactElement {
  console.log(props)
  return (
    <div
      className={css(Flex.raw(), {
        background: 'primary1'
      })}
    >
      Swap Widget
    </div>
  )
}
