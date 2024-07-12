import React, { type FC } from 'react'
import {
  Button,
  Flex,
  Text,
  ChainTokenIcon
} from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type Token } from '../../../../types/index.js'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'

type ReviewQuoteProps = {
  fromToken?: Token
  toToken?: Token
  fromAmountFormatted: string
  toAmountFormatted: string
}

export const ReviewQuoteStep: FC<ReviewQuoteProps> = ({
  fromToken,
  toToken,
  fromAmountFormatted,
  toAmountFormatted
}) => {
  return (
    <>
      <Button
        css={{
          color: 'button-disabled-color !important',
          mt: 8,
          justifyContent: 'center'
        }}
      >
        {/* @TODO: update with dynamic cta */}
        Confirm Swap
      </Button>
    </>
  )
}
