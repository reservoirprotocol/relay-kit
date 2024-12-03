import { type FC } from 'react'
import {
  Button,
  Flex,
  Text,
  ChainTokenIcon
} from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LoadingSpinner } from '../../LoadingSpinner.js'
import { type Token } from '../../../../types/index.js'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'
import type { useQuote } from '@reservoir0x/relay-kit-hooks'
import { formatDollar } from '../../../../utils/numbers.js'

type SwapConfirmationStepProps = {
  fromToken?: Token
  toToken?: Token
  quote?: ReturnType<typeof useQuote>['data']
  fromAmountFormatted: string
  toAmountFormatted: string
}

export const SwapConfirmationStep: FC<SwapConfirmationStepProps> = ({
  fromToken,
  toToken,
  quote,
  fromAmountFormatted,
  toAmountFormatted
}) => {
  const details = quote?.details
  return (
    <>
      <Flex
        align="center"
        justify="between"
        direction="column"
        css={{ flexShrink: 0, bp500: { flexDirection: 'row' } }}
      >
        <Flex
          direction="column"
          css={{
            backgroundColor: 'subtle-background-color',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Flex
            direction="column"
            align="start"
            css={{ gap: '1', cursor: 'pointer' }}
          >
            <ChainTokenIcon
              chainId={fromToken?.chainId}
              tokenlogoURI={fromToken?.logoURI}
              css={{ height: 32, width: 32 }}
            />
            <Text style="h6" ellipsify>
              {fromAmountFormatted} {fromToken?.symbol}
            </Text>
            <Text style="subtitle3" color="subtle">
              {formatDollar(Number(details?.currencyIn?.amountUsd))}
            </Text>
          </Flex>
        </Flex>
        <Text
          style="body1"
          css={{
            color: 'gray9',
            p: '0 16px',
            bp400Down: { transform: 'rotate(90deg)' }
          }}
        >
          <FontAwesomeIcon icon={faArrowRight} width={16} />
        </Text>
        <Flex
          direction="column"
          css={{
            backgroundColor: 'subtle-background-color',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Flex
            direction="column"
            align="start"
            css={{ gap: '1', cursor: 'pointer' }}
          >
            <ChainTokenIcon
              chainId={toToken?.chainId}
              tokenlogoURI={toToken?.logoURI}
              css={{ height: 32, width: 32 }}
            />
            <Text style="h6" ellipsify>
              {toAmountFormatted} {toToken?.symbol}
            </Text>
            <Text style="subtitle3" color="subtle">
              {formatDollar(Number(details?.currencyOut?.amountUsd))}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Button
        disabled={true}
        css={{
          color: 'button-disabled-color !important',
          mt: 8,
          justifyContent: 'center'
        }}
      >
        <LoadingSpinner
          css={{ height: 16, width: 16, fill: 'button-disabled-color' }}
        />
        Waiting for Wallet Confirmation
      </Button>
    </>
  )
}
