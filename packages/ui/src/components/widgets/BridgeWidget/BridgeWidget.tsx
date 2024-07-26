import type { ConfigQuery } from '@reservoir0x/relay-kit-hooks'
import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { useState, type FC } from 'react'
import { formatUnits, type Address } from 'viem'
import BridgeWidgetRenderer from './BridgeWidgetRenderer.js'
import { Box, Button, Flex, Pill, Text } from '../../primitives/index.js'
import ChainSelector from './ChainSelector.js'
import { useMounted } from '../../../hooks/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faChevronDown,
  faChevronRight,
  faClock,
  faInfoCircle,
  faStar
} from '@fortawesome/free-solid-svg-icons'
import AmountInput from '../../common/AmountInput.js'
import { EventNames } from '../../../constants/events.js'
import { formatBN, formatDollar } from '../../../utils/numbers.js'
import Tooltip from '../../../components/primitives/Tooltip.js'
import * as Collapsible from '@radix-ui/react-collapsible'
import { AnchorButton } from '../../../components/primitives/Anchor.js'
import { CurrencyDropdown } from './CurrencyDropdown.js'
import type { Currency } from '../../../constants/currencies.js'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner.js'
import { BridgeTypeSelector } from './BridgeTypeSelector.js'
import { StyledCollapsibleContent } from '../../../components/common/StyledCollapisbleContent.js'
import { FeeBreakdown } from './FeeBreakdown.js'
import { useMediaQuery } from 'usehooks-ts'

type BridgeWidgetProps = {
  defaultFromChain: RelayChain
  defaultToChain: RelayChain
  defaultToAddress?: Address
  defaultAmount?: string
  defaultCurrency?: ConfigQuery['currency']
  lockToChain?: boolean
  lockCurrency?: boolean
  modalHeader?: string
  onFromChainChange?: (chain: RelayChain) => void
  onToChainChange?: (chain: RelayChain) => void
  onCurrencyChange?: (currency: Currency) => void
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onBridgeError?: (error: string, data?: Execute) => void
}

const BridgeWidget: FC<BridgeWidgetProps> = ({
  defaultFromChain,
  defaultToChain,
  defaultToAddress,
  defaultAmount,
  defaultCurrency,
  lockToChain,
  lockCurrency,
  modalHeader,
  onFromChainChange,
  onToChainChange,
  onCurrencyChange,
  onConnectWallet,
  onAnalyticEvent,
  onBridgeError
}) => {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const isMounted = useMounted()

  return (
    <BridgeWidgetRenderer
      transactionModalOpen={transactionModalOpen}
      defaultFromChain={defaultFromChain}
      defaultToChain={defaultToChain}
      defaultToAddress={defaultToAddress}
      defaultAmount={defaultAmount}
      defaultCurrency={defaultCurrency}
    >
      {({
        fromChain,
        toChain,
        setFromChain,
        setToChain,
        price,
        isFetchingPrice,
        error,
        amountValue,
        debouncedAmountValue,
        setAmountValue,
        currency,
        setCurrency,
        depositableChains,
        withdrawableChains,
        bridgeType,
        setBridgeType,
        useExternalLiquidity,
        setUseExternalLiquidity,
        usePermit,
        fromBalance,
        fromBalanceIsLoading,
        toBalance,
        toBalanceIsLoading,
        addressModalOpen,
        setAddressModalOpen,
        address,
        customToAddress,
        recipient,
        toDisplayName,
        setCustomToAddress,
        hasInsufficientBalance,
        isAboveCapacity,
        hiddenCurrencies,
        usdPrice,
        availableAmount,
        canonicalBridgeSupported,
        maxAmount,
        feesOpen,
        setFeesOpen,
        isReward,
        transactionFee,
        feeBreakdown,
        timeEstimate,
        ctaCopy
      }) => {
        const isSmallDevice = useMediaQuery('(max-width: 600px)')

        const handleSetFromChain = (chain: RelayChain) => {
          setFromChain(chain)
          onFromChainChange?.(chain)
        }
        const handleSetToChain = (chain: RelayChain) => {
          setToChain(chain)
          onToChainChange?.(chain)
        }

        const handleSetCurrency = (currency: Currency) => {
          setCurrency(currency)
          onCurrencyChange?.(currency)
        }
        return (
          <Flex
            direction="column"
            css={{
              width: 'auto',
              borderRadius: 'widget-border-radius',
              overflow: 'hidden',
              backgroundColor: 'widget-background',
              boxShadow: 'widget-box-shadow',
              border: 'widget-border',
              p: '4',
              minWidth: 300,
              maxWidth: 440
            }}
          >
            {modalHeader ? (
              <Text style="subtitle2" color="subtle" css={{ pb: '2' }}>
                {modalHeader}
              </Text>
            ) : null}
            <Flex
              align="center"
              justify="between"
              css={{
                gap: '6px',
                bp500: {
                  flexDir: 'row'
                },
                flexDir: 'column'
              }}
            >
              <ChainSelector
                titleText="From"
                options={withdrawableChains}
                value={fromChain}
                onSelect={(chain) => {
                  if (chain.id === toChain.id) {
                    handleSetFromChain(toChain)
                    handleSetToChain(fromChain)
                  } else {
                    handleSetFromChain(chain)
                    setBridgeType('relay')
                  }
                }}
                currency={currency}
                balance={isMounted ? fromBalance : undefined}
                loadingBalance={fromBalanceIsLoading}
                hasInsufficientBalance={hasInsufficientBalance}
              />
              {fromChain.depositEnabled ? (
                <Button
                  color="ghost"
                  size="none"
                  aria-label="Swap"
                  css={{
                    p: 2,
                    borderRadius: 2,
                    _disabled: {
                      cursor: 'not-allowed',
                      backgroundColor: 'transparent'
                    }
                  }}
                  onClick={() => {
                    handleSetFromChain(toChain)
                    handleSetToChain(fromChain)
                  }}
                  disabled={lockToChain}
                >
                  <Text
                    style="body1"
                    css={{
                      color: 'gray9',
                      bp400Down: { transform: 'rotate(90deg)' },
                      width: 12
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowRight} />
                  </Text>
                </Button>
              ) : (
                <Text
                  style="body1"
                  css={{
                    color: 'gray9',
                    bp400Down: { transform: 'rotate(90deg)' },
                    p: 10
                  }}
                >
                  <FontAwesomeIcon icon={faArrowRight} width={12} />
                </Text>
              )}
              <ChainSelector
                titleText="To"
                options={depositableChains}
                value={toChain}
                onSelect={(chain) => {
                  if (chain.id === fromChain.id) {
                    handleSetFromChain(chain)
                    handleSetToChain(chain)
                  } else {
                    handleSetToChain(chain)
                    setBridgeType('relay')
                  }
                }}
                currency={currency}
                balance={isMounted ? toBalance : undefined}
                loadingBalance={toBalanceIsLoading}
                locked={lockToChain}
              />
            </Flex>
            <Flex
              css={{
                backgroundColor: 'widget-background',
                p: '12px 12px',
                borderRadius: 12,
                m: '12px 0'
              }}
              direction="column"
            >
              <Flex align="center" justify="between">
                <Text style="subtitle2" color="subtle">
                  Amount
                </Text>
                {isMounted && (address || customToAddress) ? (
                  <AnchorButton
                    css={{ display: 'flex', alignItems: 'center', gap: '2' }}
                    onClick={() => {
                      setAddressModalOpen(true)
                      onAnalyticEvent?.(EventNames.BRIDGE_ADDRESS_MODAL_CLICKED)
                    }}
                  >
                    <Text style="subtitle3" css={{ color: 'inherit' }}>
                      {toDisplayName}
                    </Text>
                    <FontAwesomeIcon icon={faChevronRight} width={8} />
                  </AnchorButton>
                ) : null}
              </Flex>
              <Flex align="center" justify="between">
                <AmountInput
                  value={amountValue}
                  setValue={setAmountValue}
                  onFocus={() => {
                    onAnalyticEvent?.(EventNames.BRIDGE_INPUT_FOCUSED)
                  }}
                />
                <CurrencyDropdown
                  hiddenCurrencies={hiddenCurrencies}
                  currency={currency}
                  setCurrency={(value) => {
                    if (value.name != 'ETH') {
                      setBridgeType('relay')
                    }
                    handleSetCurrency(value)
                  }}
                  locked={lockCurrency}
                />
              </Flex>
              <Flex align="center" justify="between">
                <Text style="subtitle2" color="subtle" ellipsify>
                  {formatDollar(usdPrice)}
                </Text>
                {availableAmount ? (
                  <Flex css={{ gap: '2', color: 'gray11' }} align="center">
                    <Tooltip
                      content={
                        <>
                          {availableAmount < 0n ? (
                            <>
                              <Text style="subtitle3">
                                Your balance is lower than the required fees.
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text
                                css={{
                                  maxW: '250px'
                                }}
                                style="subtitle3"
                              >
                                The max is the lower of either our instant send
                                capacity or the maximum you can send while
                                retaining enough gas for the transaction.
                              </Text>
                            </>
                          )}
                        </>
                      }
                    >
                      <FontAwesomeIcon
                        style={{ marginLeft: 6, width: 16 }}
                        icon={faInfoCircle}
                      />
                    </Tooltip>
                    <Text
                      style="subtitle2"
                      color={address && isAboveCapacity ? 'error' : 'subtle'}
                    >
                      {availableAmount > 0n
                        ? formatBN(availableAmount, 5, currency.decimals)
                        : 0}{' '}
                      {currency.symbol}
                    </Text>
                    <AnchorButton
                      aria-label="Max"
                      disabled={availableAmount < 0n}
                      onClick={() => {
                        setAmountValue(
                          formatUnits(availableAmount, currency.decimals)
                        )
                      }}
                    >
                      Max
                    </AnchorButton>
                  </Flex>
                ) : null}
              </Flex>
            </Flex>
            {canonicalBridgeSupported && debouncedAmountValue !== '' ? (
              <Flex direction="column" css={{ gap: '2', mb: '1' }}>
                <Flex css={{ width: '100%' }}>
                  <BridgeTypeSelector
                    bridgeType={bridgeType}
                    setBridgeType={setBridgeType}
                    onAnalyticEvent={onAnalyticEvent}
                  />
                </Flex>
                <Text color="subtle" style="body2" css={{ pb: '3' }}>
                  {bridgeType === 'relay'
                    ? 'Instant liquidity via a relayer (Limited capacity)'
                    : 'Slow liquidity via bridge (Unlimited capacity).'}
                </Text>
              </Flex>
            ) : null}
            {isFetchingPrice ? (
              <Flex
                align="center"
                css={{ gap: 14, mb: '3', p: '3 0', m: '0 auto' }}
              >
                <LoadingSpinner css={{ height: 16, width: 16 }} />
                <Text style="subtitle2">Fetching the best price</Text>
              </Flex>
            ) : null}
            {price ? (
              <Flex direction="column" css={{ gap: 14, mb: '3', p: '3 0' }}>
                <Flex
                  css={{
                    '--borderColor': 'colors.gray.3',
                    border: '1px solid var(--borderColor)',
                    borderRadius: 12,
                    p: '12px',
                    gap: '2'
                  }}
                  direction="column"
                >
                  <Flex align="center" justify="between">
                    <Text style="subtitle2">Transfer Time</Text>
                    {timeEstimate ? (
                      <Pill color={timeEstimate.time < 30 ? 'green' : 'amber'}>
                        <FontAwesomeIcon
                          icon={faClock}
                          width={16}
                          style={{
                            color:
                              timeEstimate.time < 30 ? '#30A46C' : '#FFA01C'
                          }}
                        />
                        <Text style="subtitle2">
                          ~ {timeEstimate.formattedTime}
                        </Text>
                      </Pill>
                    ) : null}
                  </Flex>
                  <Collapsible.Root
                    className="w-[300px]"
                    open={feesOpen}
                    onOpenChange={setFeesOpen}
                  >
                    <Collapsible.Trigger asChild>
                      <button style={{ width: '100%' }}>
                        <Flex align="start" justify="between">
                          <Flex css={{ gap: '2' }} align="center">
                            {isReward ? (
                              <Flex align="center" css={{ gap: '1' }}>
                                <Box css={{ color: 'primary9' }}>
                                  <FontAwesomeIcon icon={faStar} width={18} />
                                </Box>
                                <Text style="subtitle2">Reward</Text>
                              </Flex>
                            ) : (
                              <Text style="subtitle2">
                                Fees (Including Gas)
                              </Text>
                            )}

                            <Box
                              css={{
                                color: 'gray9'
                              }}
                            >
                              <FontAwesomeIcon
                                style={{
                                  transform: feesOpen
                                    ? 'rotate(180deg)'
                                    : 'rotate(0)',
                                  transition: '.3s'
                                }}
                                icon={faChevronDown}
                                width={16}
                              />
                            </Box>
                          </Flex>
                          <Flex css={{ gap: '2' }}>
                            <Text style="subtitle2">
                              {transactionFee.totalUsdFormatted}
                            </Text>
                            {!isReward ? (
                              <Tooltip
                                side={isSmallDevice ? 'top' : 'right'}
                                content={
                                  <Text
                                    style="body2"
                                    css={{
                                      maxWidth: 215,
                                      display: 'inline-block'
                                    }}
                                    color="subtle"
                                  >
                                    Price Impact
                                  </Text>
                                }
                              >
                                <Text
                                  style="body2"
                                  css={{ fontWeight: 400, fontSize: '14px' }}
                                  color="subtle"
                                >
                                  ({transactionFee.priceImpactFormatted})
                                </Text>
                              </Tooltip>
                            ) : null}
                          </Flex>
                        </Flex>
                      </button>
                    </Collapsible.Trigger>
                    <StyledCollapsibleContent>
                      <FeeBreakdown feeBreakdown={feeBreakdown.breakdown} />
                    </StyledCollapsibleContent>
                  </Collapsible.Root>
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        )
      }}
    </BridgeWidgetRenderer>
  )
}
