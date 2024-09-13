import { type Execute } from '@reservoir0x/relay-sdk'
import { type FC } from 'react'
import { Box, Flex, Text } from '../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons/faExclamationCircle'
import { type Currency } from '../../constants/currencies.js'
import { formatBN, formatDollar } from '../../utils/numbers.js'
import Tooltip from '../primitives/Tooltip.js'
import { useMediaQuery } from 'usehooks-ts'
import type { Styles } from '@reservoir0x/relay-design-system/css'

type Props = {
  error: any
  hasInsufficientBalance: boolean
  hasInsufficientSafeBalance: boolean
  isAboveCapacity?: boolean
  quote?: Partial<Execute>
  capacityPerRequest?: string
  currency?: Currency
  relayerFeeProportion?: bigint | 0
  isHighRelayerServiceFee?: boolean
  context: 'bridge' | 'swap'
  containerCss?: Styles
}

export const WidgetErrorWell: FC<Props> = ({
  error,
  hasInsufficientBalance,
  hasInsufficientSafeBalance,
  isAboveCapacity,
  quote,
  capacityPerRequest,
  currency,
  relayerFeeProportion,
  isHighRelayerServiceFee,
  context,
  containerCss
}) => {
  const isSmallDevice = useMediaQuery('(max-width: 600px)')
  const fetchQuoteErrorMessage = error
    ? error?.response?.data?.message
      ? (error?.response?.data.message as string)
      : 'Unknown Error'
    : null
  const isCapacityExceededError =
    context === 'bridge' &&
    fetchQuoteErrorMessage?.includes(
      'Amount is higher than the available liquidity'
    )

  const isHighPriceImpact = Number(quote?.details?.totalImpact?.percent) < -3.5
  const totalImpactUsd = quote?.details?.totalImpact?.usd
  const showHighPriceImpactWarning =
    isHighPriceImpact && totalImpactUsd && Number(totalImpactUsd) <= 10

  const isInsufficientLiquidityError =
    fetchQuoteErrorMessage?.includes('No quotes found')

  if (isInsufficientLiquidityError) {
    return null
  }

  if (fetchQuoteErrorMessage && !quote) {
    return (
      <Flex
        align="center"
        css={{
          gap: '2',
          p: '3',
          backgroundColor: 'red2',
          borderRadius: 12,
          mb: '3',
          ...containerCss
        }}
      >
        <Box css={{ color: 'red10' }}>
          <FontAwesomeIcon icon={faExclamationCircle} width={16} />
        </Box>
        <Text style="subtitle3" css={{ color: 'red12' }}>
          {isCapacityExceededError && currency ? (
            <>
              Due to high demand, we&apos;re limiting {context}s to{' '}
              {capacityPerRequest
                ? formatBN(
                    BigInt(capacityPerRequest),
                    5,
                    currency.decimals,
                    false
                  )
                : 0.5}{' '}
              {currency?.symbol} or less.
            </>
          ) : (
            fetchQuoteErrorMessage
          )}
        </Text>
      </Flex>
    )
  }

  if (hasInsufficientBalance) {
    return null
  }

  if (isAboveCapacity) {
    return (
      <Flex
        align="center"
        css={{
          gap: '2',
          py: '2',
          px: '3',
          backgroundColor: 'red2',
          borderRadius: 12,
          mb: '3',
          ...containerCss
        }}
      >
        <Box css={{ color: 'red9' }}>
          <FontAwesomeIcon icon={faExclamationCircle} width={16} />
        </Box>
        <Text style="subtitle3" color="error">
          Due to high demand we have a max capacity of{' '}
          {formatBN(
            BigInt(capacityPerRequest ?? 0n),
            5,
            currency?.decimals ?? 18
          )}{' '}
          {currency?.symbol}
        </Text>
      </Flex>
    )
  }

  if (hasInsufficientSafeBalance) {
    return (
      <Tooltip
        side={isSmallDevice ? 'top' : 'right'}
        content={
          <Text
            style="subtitle3"
            css={{ maxWidth: 215, display: 'inline-block' }}
          >
            We recommend decreasing the amount to account for gas fluctuations
          </Text>
        }
      >
        <Flex
          align="center"
          css={{
            gap: '2',
            py: '3',
            px: '3',
            backgroundColor: 'amber2',
            borderRadius: 12,
            mb: '3',
            ...containerCss
          }}
        >
          <Box css={{ color: 'amber10' }}>
            <FontAwesomeIcon icon={faExclamationCircle} width={16} />
          </Box>
          <Text style="subtitle3" css={{ color: 'amber12' }}>
            Your {context} amount and gas needed are close to your full balance.
            If the gas price fluctuates, you may not have enough ETH to cover
            this {context}.
          </Text>
        </Flex>
      </Tooltip>
    )
  }

  if (relayerFeeProportion && relayerFeeProportion >= 40n) {
    return (
      <Tooltip
        side={isSmallDevice ? 'top' : 'right'}
        content={
          <Text
            style="subtitle3"
            css={{ maxWidth: 215, display: 'inline-block' }}
          >
            We recommend increasing the amount or waiting for the gas fee to be
            lower.
          </Text>
        }
      >
        <Flex
          align="center"
          css={{
            gap: '2',
            py: '3',
            px: '3',
            backgroundColor: 'amber2',
            borderRadius: 12,
            mb: '3',
            ...containerCss
          }}
        >
          <Box css={{ color: 'amber10' }}>
            <FontAwesomeIcon icon={faExclamationCircle} width={16} />
          </Box>
          <Text style="subtitle3" css={{ color: 'amber12' }}>
            Fees exceed 40% of the received amount.
          </Text>
        </Flex>
      </Tooltip>
    )
  }

  if (showHighPriceImpactWarning) {
    return (
      <Flex
        align="center"
        css={{
          gap: '2',
          py: '2',
          px: '3',
          backgroundColor: 'red2',
          borderRadius: 12,
          mb: '3',
          ...containerCss
        }}
      >
        <Box css={{ color: 'red9' }}>
          <FontAwesomeIcon icon={faExclamationCircle} width={16} />
        </Box>
        <Text style="subtitle3" css={{ color: 'amber12' }}>
          The price impact is currently high (
          {quote?.details?.totalImpact?.percent}%).
        </Text>
      </Flex>
    )
  }

  if (isHighRelayerServiceFee) {
    return (
      <Flex
        align="center"
        css={{
          gap: '2',
          py: '3',
          px: '3',
          backgroundColor: 'amber2',
          borderRadius: 12,
          mb: '3',
          ...containerCss
        }}
      >
        <Box css={{ color: 'amber10' }}>
          <FontAwesomeIcon icon={faExclamationCircle} width={16} />
        </Box>
        <Text style="subtitle3" css={{ color: 'amber12' }}>
          Due to high demand, Relayer fees have temporarily been increased.
        </Text>
      </Flex>
    )
  }
  return null
}
