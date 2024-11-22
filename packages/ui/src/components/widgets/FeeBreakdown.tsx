import { useState, type FC } from 'react'
import { Box, Flex, Text } from '../primitives/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import { formatNumber } from '../../utils/numbers.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGasPump } from '@fortawesome/free-solid-svg-icons/faGasPump'
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock'
import FetchingQuoteLoader from '../widgets/FetchingQuoteLoader.js'
import SwapRouteSelector from '../widgets/SwapRouteSelector.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'

type Props = Pick<
  ChildrenProps,
  | 'feeBreakdown'
  | 'isFetchingPrice'
  | 'price'
  | 'toToken'
  | 'fromToken'
  | 'timeEstimate'
  | 'supportsExternalLiquidity'
  | 'useExternalLiquidity'
  | 'setUseExternalLiquidity'
  | 'canonicalTimeEstimate'
> & {
  toChain?: RelayChain
  isSingleChainLocked?: boolean
}

const formatSwapRate = (rate: number) => {
  return rate >= 1 ? formatNumber(rate, 2) : formatNumber(rate, 5)
}

const FeeBreakdown: FC<Props> = ({
  feeBreakdown,
  isFetchingPrice,
  price,
  toToken,
  fromToken,
  toChain,
  supportsExternalLiquidity,
  useExternalLiquidity,
  setUseExternalLiquidity,
  timeEstimate,
  canonicalTimeEstimate,
  isSingleChainLocked
}) => {
  const swapRate = price?.details?.rate
  const originGasFee = feeBreakdown?.breakdown?.find(
    (fee) => fee.id === 'origin-gas'
  )

  const [rateMode, setRateMode] = useState<'input' | 'output'>('input')
  if (!feeBreakdown) {
    if (isFetchingPrice) {
      return (
        <Box
          id={'fee-breakdown-section'}
          css={{
            borderRadius: 'widget-card-border-radius',
            backgroundColor: 'widget-background',
            border: 'widget-card-border',
            overflow: 'hidden',
            mb: 'widget-card-section-gutter'
          }}
        >
          <FetchingQuoteLoader
            isLoading={isFetchingPrice}
            containerCss={{
              mt: 0,
              mb: 0,
              px: '4',
              py: '3',
              width: '100%',
              justifyContent: 'center'
            }}
          />
        </Box>
      )
    } else {
      return null
    }
  }

  return (
    <Box
      css={{
        borderRadius: 'widget-card-border-radius',
        backgroundColor: 'widget-background',
        border: 'widget-card-border',
        overflow: 'hidden',
        mb: 'widget-card-section-gutter'
      }}
      id={'fee-breakdown-section'}
    >
      {!isSingleChainLocked ? (
        <>
          <SwapRouteSelector
            chain={toChain}
            supportsExternalLiquidity={supportsExternalLiquidity}
            externalLiquidtySelected={useExternalLiquidity}
            onExternalLiquidityChange={(selected) => {
              setUseExternalLiquidity(selected)
            }}
            canonicalTimeEstimate={canonicalTimeEstimate?.formattedTime}
          />
          <Box css={{ height: 1, background: 'gray5', width: '100%' }} />
        </>
      ) : null}
      <Flex
        justify="between"
        css={{
          flexDirection: 'row',
          gap: '2',
          width: '100%',
          p: '3'
        }}
      >
        <button
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            setRateMode(rateMode === 'input' ? 'output' : 'input')
            e.preventDefault()
          }}
        >
          {rateMode === 'input' ? (
            <Text style="subtitle2">
              1 {fromToken?.symbol} = {formatSwapRate(Number(swapRate))}{' '}
              {toToken?.symbol}
            </Text>
          ) : (
            <Text style="subtitle2">
              1 {toToken?.symbol} = {formatSwapRate(1 / Number(swapRate))}{' '}
              {fromToken?.symbol}
            </Text>
          )}
        </button>

        <Flex
          css={{
            gap: '2',
            color:
              timeEstimate && timeEstimate.time <= 30
                ? '{colors.green.9}'
                : '{colors.amber.9}'
          }}
          align="center"
        >
          {timeEstimate && timeEstimate?.time !== 0 ? (
            <>
              <FontAwesomeIcon icon={faClock} width={16} />
              <Text style="subtitle2">~ {timeEstimate?.formattedTime}</Text>
              <Box css={{ color: 'gray6' }}>&#8226;</Box>
            </>
          ) : null}
          <FontAwesomeIcon
            icon={faGasPump}
            width={16}
            style={{ color: '#C1C8CD' }}
          />
          <Text style="subtitle2">{originGasFee?.usd}</Text>
        </Flex>
      </Flex>
    </Box>
  )
}

export default FeeBreakdown
