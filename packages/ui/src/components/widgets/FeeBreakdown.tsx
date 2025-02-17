import { useState, type FC } from 'react'
import { Box, Button, Flex, Text } from '../primitives/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import { formatBN, formatNumber } from '../../utils/numbers.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGasPump } from '@fortawesome/free-solid-svg-icons/faGasPump'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import FetchingQuoteLoader from '../widgets/FetchingQuoteLoader.js'
import SwapRouteSelector from '../widgets/SwapRouteSelector.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger
} from '../primitives/Collapsible.js'
import {
  faChevronRight,
  faClock,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons'
import { PriceImpactTooltip } from './PriceImpactTooltip.js'
import { getSlippageRating, ratingToColor } from '../../utils/slippage.js'
import Tooltip from '../primitives/Tooltip.js'
import React from 'react'

type Props = Pick<
  ChildrenProps,
  | 'feeBreakdown'
  | 'isFetchingQuote'
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
  fromChainWalletVMSupported?: boolean
  isAutoSlippage: boolean
}

const formatSwapRate = (rate: number) => {
  return rate >= 1 ? formatNumber(rate, 2) : formatNumber(rate, 5)
}

const FeeBreakdown: FC<Props> = ({
  feeBreakdown,
  isFetchingQuote,
  price,
  toToken,
  fromToken,
  toChain,
  supportsExternalLiquidity,
  useExternalLiquidity,
  setUseExternalLiquidity,
  timeEstimate,
  canonicalTimeEstimate,
  isSingleChainLocked,
  fromChainWalletVMSupported,
  isAutoSlippage
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const swapRate = price?.details?.rate
  const originGasFee = feeBreakdown?.breakdown?.find(
    (fee) => fee.id === 'origin-gas'
  )

  const [rateMode, setRateMode] = useState<'input' | 'output'>('input')

  const isHighPriceImpact = Number(price?.details?.totalImpact?.percent) < -3.5
  const slippage =
    price?.details?.slippageTolerance?.destination?.percent ??
    price?.details?.slippageTolerance?.origin?.percent ??
    '0'

  const slippageRating = getSlippageRating(slippage)
  const slippageRatingColor = ratingToColor[slippageRating]
  const minimumAmountFormatted = price?.details?.currencyOut?.minimumAmount
    ? formatBN(
        price.details.currencyOut.minimumAmount,
        6,
        toToken?.decimals,
        false
      )
    : undefined

  const breakdown = [
    {
      title: 'Estimated time',
      value: (
        <Flex
          align="center"
          css={{
            gap: '1',
            color:
              timeEstimate && timeEstimate.time <= 30
                ? '{colors.green.9}'
                : '{colors.amber.9}'
          }}
        >
          <FontAwesomeIcon icon={faClock} width={16} />
          <Text style="subtitle2">~ {timeEstimate?.formattedTime}</Text>
        </Flex>
      )
    },
    {
      title: 'Network cost',
      value: (
        <Flex align="center" css={{ gap: '1' }}>
          <FontAwesomeIcon
            icon={faGasPump}
            width={16}
            style={{ color: '#C1C8CD' }}
          />
          <Text style="subtitle2">{originGasFee?.usd}</Text>
        </Flex>
      )
    },
    {
      title: 'Price Impact',
      value: (
        <PriceImpactTooltip
          feeBreakdown={feeBreakdown}
          tooltipProps={{ side: 'top', align: 'end' }}
        >
          {
            <div>
              <Flex align="center" css={{ gap: '1', color: 'gray8' }}>
                <Text
                  style="subtitle2"
                  css={{
                    color: isHighPriceImpact ? 'red11' : undefined
                  }}
                >
                  {feeBreakdown?.totalFees?.priceImpactPercentage}
                </Text>
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  width={14}
                  height={14}
                  style={{
                    display: 'inline-block',
                    marginLeft: 4
                  }}
                />
              </Flex>
            </div>
          }
        </PriceImpactTooltip>
      )
    },
    {
      title: 'Max Slippage',
      value: (
        <Flex align="center" css={{ gap: '1' }}>
          {isAutoSlippage ? (
            <Text
              style="subtitle3"
              css={{ py: '1px', px: '4px', bg: 'gray3', borderRadius: 100 }}
            >
              Auto
            </Text>
          ) : null}

          <Tooltip
            side="top"
            align="end"
            content={
              minimumAmountFormatted ? (
                <Flex direction="row" css={{ gap: '2' }}>
                  <Text style="subtitle2" color="subtle">
                    Min. received
                  </Text>
                  <Text style="subtitle2">
                    {minimumAmountFormatted} {toToken?.symbol}
                  </Text>
                </Flex>
              ) : null
            }
          >
            <Text style="subtitle2" css={{ color: slippageRatingColor }}>
              {slippage}%
            </Text>
          </Tooltip>
        </Flex>
      )
    }
  ]

  if (!isSingleChainLocked && fromChainWalletVMSupported) {
    breakdown.unshift({
      title: 'Route',
      value: (
        <SwapRouteSelector
          chain={toChain}
          supportsExternalLiquidity={supportsExternalLiquidity}
          externalLiquidtySelected={useExternalLiquidity}
          onExternalLiquidityChange={(selected) => {
            setUseExternalLiquidity(selected)
          }}
          canonicalTimeEstimate={canonicalTimeEstimate?.formattedTime}
          trigger={
            <Button color="ghost" size="none">
              <Flex css={{ gap: '2', alignItems: 'center' }}>
                <Text style="subtitle2">
                  {useExternalLiquidity ? 'Native' : 'Relay'}
                </Text>
                {supportsExternalLiquidity || useExternalLiquidity ? (
                  <Box css={{ color: 'gray11', width: 14, flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faChevronRight} width={14} />
                  </Box>
                ) : null}
              </Flex>
            </Button>
          }
        />
      )
    })
  }

  if (!feeBreakdown) {
    if (isFetchingQuote) {
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
            isLoading={isFetchingQuote}
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
    <CollapsibleRoot
      open={isOpen}
      onOpenChange={setIsOpen}
      css={{ mb: 'widget-card-section-gutter' }}
    >
      <CollapsibleTrigger
        css={{
          borderRadius: 'widget-card-border-radius',
          borderBottomRadius: isOpen ? '0' : 'widget-card-border-radius',
          backgroundColor: 'widget-background',
          border: 'widget-card-border',
          overflow: 'hidden',
          transition: 'border-radius 300ms'
        }}
        id={'fee-breakdown-section'}
      >
        <Flex
          justify="between"
          css={{
            flexDirection: 'row',
            gap: '2',
            width: '100%',
            p: '3'
          }}
        >
          <span
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
          </span>

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
            {!isOpen && timeEstimate && timeEstimate?.time !== 0 ? (
              <>
                <FontAwesomeIcon icon={faClock} width={16} />
                <Text style="subtitle2">~ {timeEstimate?.formattedTime}</Text>
                <Box css={{ color: 'gray6' }}>&#8226;</Box>
              </>
            ) : null}
            {!isOpen && (
              <>
                <FontAwesomeIcon
                  icon={faGasPump}
                  width={16}
                  style={{ color: '#C1C8CD' }}
                />
                <Text style="subtitle2">{originGasFee?.usd}</Text>
              </>
            )}
            <Box
              css={{
                marginLeft: '2',
                transition: 'transform 300ms',
                transform: isOpen ? 'rotate(-180deg)' : 'rotate(0)',
                color: 'gray9'
              }}
            >
              <FontAwesomeIcon icon={faChevronDown} width={12} />
            </Box>
          </Flex>
        </Flex>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Flex
          direction="column"
          css={{
            px: '3',
            pb: '3',
            pt: '0',
            gap: '2',
            backgroundColor: 'widget-background',
            borderRadius: '0 0 12px 12px'
          }}
        >
          {breakdown.map((item) => (
            <React.Fragment key={item.title}>
              <Flex
                justify="between"
                align="center"
                css={{ width: '100%', gap: '4' }}
              >
                <Text
                  style="subtitle2"
                  color="subtle"
                  css={{ alignSelf: 'flex-start' }}
                >
                  {item.title}
                </Text>
                {item.value}
              </Flex>
            </React.Fragment>
          ))}
        </Flex>
      </CollapsibleContent>
    </CollapsibleRoot>
  )
}

export default FeeBreakdown
