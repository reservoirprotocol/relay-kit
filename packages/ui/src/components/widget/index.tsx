import { Flex, Button, Text, Box } from '../primitives'
import type { FC } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { easeInOut, motion } from 'framer-motion'
import { CustomAddressModal } from '../common/CustomAddressModal'
import {
  useCurrencyBalance,
  useENSResolver,
  useMounted,
  useRelayClient,
  useDebounceState
} from '../../hooks'
import type { Address } from 'viem'
import { formatUnits, parseUnits, zeroAddress } from 'viem'
import { useAccount, useConfig, useWalletClient } from 'wagmi'
import TokenSelector from '../common/TokenSelector'
import type { Token } from '../../types'
import Anchor, { AnchorButton } from '../primitives/Anchor'
import {
  formatNumber,
  formatFixedLength,
  formatDollar
} from '../../utils/numbers'
import { mainnet } from 'viem/chains'
import { useQueryClient } from '@tanstack/react-query'
import AmountInput from '../common/AmountInput'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock'
import { faGasPump } from '@fortawesome/free-solid-svg-icons/faGasPump'
import { deadAddress } from '../../constants/address'
import type { Execute } from '@reservoir0x/relay-sdk'
import * as Collapsible from '@radix-ui/react-collapsible'
import { StyledCollapsibleContent } from '../common/StyledCollapisbleContent'
import { FeeBreakdown } from '../common/FeeBreakdown'
import {
  calculateRelayerFeeProportionUsd,
  calculateTimeEstimate,
  extractQuoteId,
  isHighRelayerServiceFeeUsd,
  parseFees
} from '../../utils/quote'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { WidgetErrorWell } from '../common/WidgetErrorWell'
import { SwapModal } from '../common/TransactionModal/SwapModal'
import { switchChain } from 'wagmi/actions'
import { BalanceDisplay } from '../common/BalanceDisplay'
import { useMediaQuery } from 'usehooks-ts'
import { useSwapQuote } from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../constants/events'
import { ProviderOptionsContext } from '../../providers/RelayKitProvider'

type SwapWidgetProps = {
  defaultFromToken?: Token
  defaultToToken?: Token
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

const SwapWidget: FC<SwapWidgetProps> = ({
  defaultFromToken,
  defaultToToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  onConnectWallet,
  onAnalyticEvent
}) => {
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const wagmiConfig = useConfig()
  const relayClient = useRelayClient()
  const walletClient = useWalletClient()
  const isSmallDevice = useMediaQuery('(max-width: 730px)')
  const { address, chainId: activeWalletChainId, connector } = useAccount()
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [customToAddress, setCustomToAddress] = useState<Address | undefined>(
    defaultToAddress
  )
  const { displayName: toDisplayName } = useENSResolver(
    customToAddress ?? address
  )
  const isMounted = useMounted()
  const [tradeType, setTradeType] = useState<'EXACT_INPUT' | 'EXACT_OUTPUT'>(
    defaultTradeType ?? 'EXACT_INPUT'
  )
  const queryClient = useQueryClient()
  const [steps, setSteps] = useState<null | Execute['steps']>(null)
  const [details, setDetails] = useState<null | Execute['details']>(null)
  const [waitingForSteps, setWaitingForSteps] = useState(false)
  const {
    value: amountInputValue,
    debouncedValue: debouncedInputAmountValue,
    setValue: setAmountInputValue,
    debouncedControls: debouncedAmountInputControls
  } = useDebounceState<string>(
    !defaultTradeType || defaultTradeType === 'EXACT_INPUT'
      ? defaultAmount ?? ''
      : '',
    500
  )
  const {
    value: amountOutputValue,
    debouncedValue: debouncedOutputAmountValue,
    setValue: setAmountOutputValue,
    debouncedControls: debouncedAmountOutputControls
  } = useDebounceState<string>(
    defaultTradeType === 'EXACT_OUTPUT' ? defaultAmount ?? '' : '',
    500
  )

  const [feesOpen, setFeesOpen] = useState(false)
  const [rateMode, setRateMode] = useState<'input' | 'output'>('input')
  const [swapError, setSwapError] = useState<Error | null>(null)
  const defaultChainId = relayClient?.chains[0].id ?? mainnet.id

  const [fromToken, setFromToken] = useState<Token | undefined>(
    defaultFromToken ?? {
      chainId: defaultChainId,
      address: zeroAddress,
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
      logoURI: 'https://assets.relay.link/icons/1/light.png'
    }
  )
  const [toToken, setToToken] = useState<Token | undefined>(defaultToToken)

  const {
    value: fromBalance,
    queryKey: fromBalanceQueryKey,
    isLoading: isLoadingFromBalance,
    isError: fromBalanceErrorFetching
  } = useCurrencyBalance({
    chainId: fromToken?.chainId ? fromToken.chainId : 0,
    address: address,
    currency: fromToken?.address ? (fromToken.address as Address) : undefined,
    enabled: fromToken !== undefined
  })

  const {
    value: toBalance,
    queryKey: toBalanceQueryKey,
    isLoading: isLoadingToBalance
  } = useCurrencyBalance({
    chainId: toToken?.chainId ? toToken.chainId : 0,
    address: customToAddress ?? address,
    currency: toToken?.address ? (toToken.address as Address) : undefined,
    enabled: toToken !== undefined
  })

  const invalidateBalanceQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: fromBalanceQueryKey })
    queryClient.invalidateQueries({ queryKey: toBalanceQueryKey })
    queryClient.invalidateQueries({ queryKey: ['useDuneBalances'] })
  }, [queryClient, fromBalanceQueryKey, toBalanceQueryKey, address])

  const {
    data: quote,
    isLoading: isFetchingQuote,
    swap: executeSwap,
    error
  } = useSwapQuote(
    relayClient ? relayClient : undefined,
    walletClient.data,
    fromToken && toToken
      ? {
          user: customToAddress ?? address ?? deadAddress,
          originChainId: fromToken.chainId,
          destinationChainId: toToken.chainId,
          originCurrency: fromToken.address,
          destinationCurrency: toToken.address,
          recipient: (customToAddress ?? address) as string,
          tradeType,
          amount:
            tradeType === 'EXACT_INPUT'
              ? parseUnits(
                  debouncedInputAmountValue,
                  fromToken.decimals
                ).toString()
              : parseUnits(
                  debouncedOutputAmountValue,
                  toToken.decimals
                ).toString()
        }
      : undefined,
    () => {},
    () => {},
    {
      enabled:
        Boolean(
          relayClient &&
            ((tradeType === 'EXACT_INPUT' &&
              debouncedInputAmountValue &&
              debouncedInputAmountValue.length > 0 &&
              Number(debouncedInputAmountValue) !== 0) ||
              (tradeType === 'EXACT_OUTPUT' &&
                debouncedOutputAmountValue &&
                debouncedOutputAmountValue.length > 0 &&
                Number(debouncedOutputAmountValue) !== 0))
        ) &&
        fromToken !== undefined &&
        toToken !== undefined,
      refetchInterval:
        steps === null &&
        debouncedInputAmountValue === amountInputValue &&
        debouncedOutputAmountValue === amountOutputValue
          ? 12000
          : undefined
    }
  )

  useEffect(() => {
    if (tradeType === 'EXACT_INPUT') {
      const amountOut = quote?.details?.currencyOut?.amount ?? ''
      setAmountOutputValue(
        amountOut !== ''
          ? formatUnits(
              BigInt(amountOut),
              Number(quote?.details?.currencyOut?.currency?.decimals ?? 18)
            )
          : ''
      )
    } else if (tradeType === 'EXACT_OUTPUT') {
      const amountIn = quote?.details?.currencyIn?.amount ?? ''
      setAmountInputValue(
        amountIn !== ''
          ? formatUnits(
              BigInt(amountIn),
              Number(quote?.details?.currencyIn?.currency?.decimals ?? 18)
            )
          : ''
      )
    }
    debouncedAmountInputControls.flush()
    debouncedAmountOutputControls.flush()
  }, [quote, tradeType])

  const feeBreakdown = useMemo(() => {
    const chains = relayClient?.chains
    const fromChain = chains?.find((chain) => chain.id === fromToken?.chainId)
    const toChain = chains?.find((chain) => chain.id === toToken?.chainId)
    return fromToken && toToken && fromChain && toChain && quote
      ? parseFees(quote?.fees, toChain, fromChain)
      : null
  }, [quote, fromToken, toToken, relayClient])

  const totalAmount = BigInt(quote?.details?.currencyIn?.amount ?? 0n)

  const hasInsufficientBalance = Boolean(
    !fromBalanceErrorFetching &&
      totalAmount &&
      address &&
      (fromBalance ?? 0n) < totalAmount
  )

  const fetchQuoteErrorMessage = error
    ? error?.message
      ? (error?.message as string)
      : 'Unknown Error'
    : null
  const isInsufficientLiquidityError = fetchQuoteErrorMessage?.includes(
    'No quotes available'
  )

  const timeEstimate = calculateTimeEstimate(quote?.breakdown)
  const originGasFee = feeBreakdown?.find((fee) => fee.id === 'origin-gas')

  const swapRate = quote?.details?.rate
  const compactSwapRate = Boolean(swapRate && swapRate.length > 8)
  const highRelayerServiceFee = isHighRelayerServiceFeeUsd(quote)
  const relayerFeeProportion = calculateRelayerFeeProportionUsd(quote)

  const isFromETH = fromToken?.symbol === 'ETH'

  const isWrap =
    isFromETH &&
    toToken?.symbol === 'WETH' &&
    fromToken.chainId === toToken.chainId
  const isUnwrap =
    fromToken?.symbol === 'WETH' &&
    toToken?.symbol === 'ETH' &&
    fromToken.chainId === toToken.chainId

  let ctaCopy = 'Swap'

  if (isWrap) {
    ctaCopy = 'Wrap'
  } else if (isUnwrap) {
    ctaCopy = 'Unwrap'
  }

  if (!fromToken || !toToken) {
    ctaCopy = 'Select a token'
  } else if (!debouncedInputAmountValue || !debouncedOutputAmountValue) {
    ctaCopy = 'Enter an amount'
  } else if (hasInsufficientBalance) {
    ctaCopy = 'Insufficient Balance'
  } else if (isInsufficientLiquidityError) {
    ctaCopy = 'Insufficient Liquidity'
  } else if (steps !== null) {
    ctaCopy = 'Swapping'
    if (isWrap) {
      ctaCopy = 'Wrapping'
    } else if (isUnwrap) {
      ctaCopy = 'Unwrapping'
    }
  }

  const swap = useCallback(async () => {
    try {
      onAnalyticEvent?.(EventNames.SWAP_CTA_CLICKED)
      setWaitingForSteps(true)

      if (!executeSwap) {
        throw 'Missing a quote'
      }

      if (fromToken && fromToken?.chainId !== activeWalletChainId) {
        onAnalyticEvent?.(EventNames.SWAP_SWITCH_NETWORK)
        await switchChain(wagmiConfig, {
          chainId: fromToken.chainId
        })
      }

      executeSwap(
        ({ steps, currentStep, currentStepItem, txHashes, details }) => {
          // Only send event on first onProgress callback
          const firstStepId = steps && steps[0] ? steps[0].id : ''
          if (
            (currentStep?.id === firstStepId &&
              currentStepItem?.status === 'incomplete' &&
              !txHashes) ||
            (txHashes && txHashes.length === 0)
          ) {
            onAnalyticEvent?.(EventNames.SWAP_EXECUTE_QUOTE_RECEIVED, {
              wallet_connector: connector?.name,
              quote_id: steps ? extractQuoteId(steps) : undefined,
              amount_in: parseFloat(`${debouncedInputAmountValue}`),
              currency_in: fromToken?.symbol,
              chain_id_in: fromToken?.chainId,
              amount_out: parseFloat(`${debouncedOutputAmountValue}`),
              currency_out: toToken?.symbol,
              chain_id_out: toToken?.chainId
            })
          }

          setSteps(steps)
          setDetails(details)
        }
      )
        ?.catch((error: any) => {
          if (
            error &&
            ((typeof error.message === 'string' &&
              error.message.includes('rejected')) ||
              (typeof error === 'string' && error.includes('rejected')))
          ) {
            onAnalyticEvent?.(EventNames.USER_REJECTED_WALLET)
            setSteps(null)
            setDetails(null)
            return
          }

          const errorMessage = error?.response?.data?.message
            ? new Error(error?.response?.data?.message)
            : error

          onAnalyticEvent?.(EventNames.SWAP_ERROR, {
            error_message: errorMessage,
            wallet_connector: connector?.name,
            quote_id: steps ? extractQuoteId(steps) : undefined,
            amount_in: parseFloat(`${debouncedInputAmountValue}`),
            currency_in: fromToken?.symbol,
            chain_id_in: fromToken?.chainId,
            amount_out: parseFloat(`${debouncedOutputAmountValue}`),
            currency_out: toToken?.symbol,
            chain_id_out: toToken?.chainId
          })
          setSwapError(errorMessage)
        })
        .finally(() => {
          setWaitingForSteps(false)
          invalidateBalanceQueries()
        })
    } catch (e) {
      setWaitingForSteps(false)
      onAnalyticEvent?.(EventNames.SWAP_ERROR, {
        error_message: e,
        wallet_connector: connector?.name,
        quote_id: steps ? extractQuoteId(steps) : undefined,
        amount_in: parseFloat(`${debouncedInputAmountValue}`),
        currency_in: fromToken?.symbol,
        chain_id_in: fromToken?.chainId,
        amount_out: parseFloat(`${debouncedOutputAmountValue}`),
        currency_out: toToken?.symbol,
        chain_id_out: toToken?.chainId
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    relayClient,
    activeWalletChainId,
    wagmiConfig,
    address,
    connector,
    fromToken,
    toToken,
    customToAddress,
    debouncedInputAmountValue,
    debouncedOutputAmountValue,
    tradeType,
    executeSwap,
    setSteps,
    setDetails,
    invalidateBalanceQueries
  ])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: easeInOut
      }}
    >
      <Flex
        direction="column"
        css={{
          width: '100%',
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
        <Flex
          align="center"
          justify="between"
          css={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            backgroundColor: 'widget-card-background',
            gap: '3',
            p: '12px 12px',
            borderRadius: 'widget-card-border-radius',
            border: 'widget-card-border'
          }}
        >
          <Text style="subtitle1">From</Text>
          <Flex align="center" justify="between" css={{ gap: '4' }}>
            <TokenSelector
              token={fromToken}
              onAnalyticEvent={onAnalyticEvent}
              setToken={(token) => {
                onAnalyticEvent?.(EventNames.SWAP_TOKEN_SELECT, {
                  direction: 'input',
                  token_symbol: token.symbol
                })
                if (
                  token.address === toToken?.address &&
                  token.chainId === toToken?.chainId
                ) {
                  setFromToken(toToken)
                  setToToken(fromToken)
                } else {
                  setFromToken(token)
                }
              }}
              context="from"
            />
            <AmountInput
              value={
                tradeType === 'EXACT_INPUT'
                  ? amountInputValue
                  : amountInputValue
                    ? formatFixedLength(amountInputValue, 8)
                    : amountInputValue
              }
              setValue={(e) => {
                setAmountInputValue(e)
                setTradeType('EXACT_INPUT')
                if (Number(e) === 0) {
                  setAmountOutputValue('')
                  debouncedAmountInputControls.flush()
                }
              }}
              onFocus={() => {
                onAnalyticEvent?.(EventNames.SWAP_INPUT_FOCUSED)
              }}
              css={{
                textAlign: 'right',
                color:
                  isFetchingQuote && tradeType === 'EXACT_OUTPUT'
                    ? 'gray11'
                    : 'gray12',
                _placeholder: {
                  color:
                    isFetchingQuote && tradeType === 'EXACT_OUTPUT'
                      ? 'gray11'
                      : 'gray12'
                }
              }}
            />
          </Flex>
          <Flex
            align="center"
            justify="between"
            css={{ gap: '3', width: '100%' }}
          >
            <Flex align="center" css={{ gap: '3' }}>
              {fromToken ? (
                <BalanceDisplay
                  isLoading={isLoadingFromBalance}
                  balance={fromBalance}
                  decimals={fromToken?.decimals}
                  symbol={fromToken?.symbol}
                  hasInsufficientBalance={hasInsufficientBalance}
                />
              ) : (
                <Flex css={{ height: 18 }} />
              )}
              {fromBalance ? (
                <AnchorButton
                  aria-label="MAX"
                  css={{ fontSize: 12 }}
                  onClick={() => {
                    if (fromToken) {
                      setAmountInputValue(
                        formatUnits(
                          isFromETH ? (fromBalance * 99n) / 100n : fromBalance,
                          fromToken?.decimals
                        )
                      )
                      setTradeType('EXACT_INPUT')
                      debouncedAmountOutputControls.cancel()
                      debouncedAmountInputControls.flush()
                    }
                  }}
                >
                  MAX
                </AnchorButton>
              ) : null}
            </Flex>
            {quote?.details?.currencyIn?.amountUsd &&
            Number(quote.details.currencyIn.amountUsd) > 0 ? (
              <Text style="subtitle3" color="subtle">
                {formatDollar(Number(quote.details.currencyIn.amountUsd))}
              </Text>
            ) : null}
          </Flex>
        </Flex>
        <Box
          css={{
            position: 'relative',
            my: -10,
            mx: 'auto',
            height: 40
          }}
        >
          <Button
            size="small"
            color="white"
            css={{
              color: 'gray9',
              alignSelf: 'center',
              px: '2',
              py: '2',
              borderWidth: '2px !important',
              minHeight: 30,
              zIndex: 10
            }}
            onClick={() => {
              if (fromToken || toToken) {
                if (tradeType === 'EXACT_INPUT') {
                  setTradeType('EXACT_OUTPUT')
                  setAmountInputValue('')
                  setAmountOutputValue(amountInputValue)
                } else {
                  setTradeType('EXACT_INPUT')
                  setAmountOutputValue('')
                  setAmountInputValue(amountOutputValue)
                }

                setFromToken(toToken)
                setToToken(fromToken)
                debouncedAmountInputControls.flush()
                debouncedAmountOutputControls.flush()
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowDown} width={16} height={16} />
          </Button>
        </Box>
        <Flex
          align="center"
          justify="between"
          css={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            backgroundColor: 'widget-card-background',
            gap: '3',
            p: '12px 12px',
            borderRadius: 'widget-card-border-radius',
            border: 'widget-card-border',
            mb: '3'
          }}
        >
          <Flex css={{ width: '100%' }} justify="between">
            <Text style="subtitle1">To</Text>
            {isMounted && (address || customToAddress) ? (
              <AnchorButton
                css={{ display: 'flex', alignItems: 'center', gap: '2' }}
                onClick={() => {
                  setAddressModalOpen(true)
                  onAnalyticEvent?.(EventNames.SWAP_ADDRESS_MODAL_CLICKED)
                }}
              >
                <Text style="subtitle3" css={{ color: 'inherit' }}>
                  {toDisplayName}
                </Text>
                <FontAwesomeIcon icon={faChevronRight} width={8} />
              </AnchorButton>
            ) : null}
          </Flex>
          <Flex align="center" justify="between" css={{ gap: '4' }}>
            <TokenSelector
              token={toToken}
              setToken={(token) => {
                onAnalyticEvent?.(EventNames.SWAP_TOKEN_SELECT, {
                  direction: 'output',
                  token_symbol: token.symbol
                })
                if (
                  token.address === fromToken?.address &&
                  token.chainId === fromToken?.chainId
                ) {
                  setToToken(fromToken)
                  setFromToken(toToken)
                } else {
                  setToToken(token)
                }
              }}
              context="to"
              onAnalyticEvent={onAnalyticEvent}
            />
            <AmountInput
              value={
                tradeType === 'EXACT_OUTPUT'
                  ? amountOutputValue
                  : amountOutputValue
                    ? formatFixedLength(amountOutputValue, 8)
                    : amountOutputValue
              }
              setValue={(e) => {
                setAmountOutputValue(e)
                setTradeType('EXACT_OUTPUT')
                if (Number(e) === 0) {
                  setAmountInputValue('')
                  debouncedAmountOutputControls.flush()
                }
              }}
              disabled={!toToken}
              onFocus={() => {
                onAnalyticEvent?.(EventNames.SWAP_OUTPUT_FOCUSED)
              }}
              css={{
                color:
                  isFetchingQuote && tradeType === 'EXACT_INPUT'
                    ? 'gray11'
                    : 'gray12',
                _placeholder: {
                  color:
                    isFetchingQuote && tradeType === 'EXACT_INPUT'
                      ? 'gray11'
                      : 'gray12'
                },
                textAlign: 'right',
                _disabled: {
                  cursor: 'not-allowed',
                  _placeholder: {
                    color: 'gray10'
                  }
                }
              }}
            />
          </Flex>
          <Flex
            align="center"
            justify="between"
            css={{ gap: '3', width: '100%' }}
          >
            {toToken ? (
              <BalanceDisplay
                isLoading={isLoadingToBalance}
                balance={toBalance}
                decimals={toToken?.decimals}
                symbol={toToken?.symbol}
              />
            ) : (
              <Flex css={{ height: 18 }} />
            )}
            {quote?.details?.currencyOut?.amountUsd &&
            Number(quote.details.currencyOut.amountUsd) > 0 ? (
              <Text style="subtitle3" color="subtle" css={{}}>
                {formatDollar(Number(quote.details.currencyOut.amountUsd))}
              </Text>
            ) : null}
          </Flex>
        </Flex>
        {isFetchingQuote ? (
          <Flex
            align="center"
            css={{ gap: 14, mb: '3', p: '3 0', m: '0 auto' }}
          >
            <LoadingSpinner css={{ height: 16, width: 16 }} />
            <Text style="subtitle2">Fetching the best price</Text>
          </Flex>
        ) : null}
        {feeBreakdown && !isFetchingQuote ? (
          <Box
            css={{
              borderRadius: 16,
              overflow: 'hidden',
              '--borderColor': 'colors.subtle-border-color',
              border: '1px solid var(--borderColor)',
              p: '3',
              mb: '3'
            }}
          >
            <Collapsible.Root
              className="w-[300px]"
              open={feesOpen}
              onOpenChange={setFeesOpen}
            >
              <Collapsible.Trigger asChild>
                <button
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Flex
                    justify="between"
                    css={{
                      flexDirection: isSmallDevice ? 'column' : 'row',
                      alignItems: isSmallDevice ? 'start' : 'row',
                      gap: isSmallDevice ? '2' : undefined,
                      width: '100%'
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
                          1 {fromToken?.symbol} ={' '}
                          {formatNumber(
                            Number(swapRate) / 1,
                            5,
                            compactSwapRate
                          )}{' '}
                          {toToken?.symbol}
                        </Text>
                      ) : (
                        <Text style="subtitle2">
                          1 {toToken?.symbol} ={' '}
                          {formatNumber(
                            1 / Number(swapRate),
                            5,
                            compactSwapRate
                          )}{' '}
                          {fromToken?.symbol}
                        </Text>
                      )}
                    </button>

                    <Flex css={{ gap: '2' }} align="center">
                      {feesOpen ? null : (
                        <>
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
                          <Box
                            css={{ width: 1, background: 'gray6', height: 20 }}
                          />
                          <FontAwesomeIcon
                            icon={faGasPump}
                            width={16}
                            style={{ color: '#C1C8CD' }}
                          />
                          <Text style="subtitle2">{originGasFee?.usd}</Text>
                        </>
                      )}
                      {isSmallDevice ? null : (
                        <Flex
                          css={{
                            color: 'gray9',
                            alignItems: 'center'
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
                        </Flex>
                      )}
                    </Flex>
                  </Flex>
                  {isSmallDevice ? (
                    <Flex
                      css={{
                        color: 'gray9',
                        alignItems: 'center'
                      }}
                    >
                      <FontAwesomeIcon
                        style={{
                          transform: feesOpen ? 'rotate(180deg)' : 'rotate(0)',
                          transition: '.3s'
                        }}
                        icon={faChevronDown}
                        width={16}
                      />
                    </Flex>
                  ) : null}
                </button>
              </Collapsible.Trigger>
              <StyledCollapsibleContent>
                <Box
                  css={{
                    height: 1,
                    width: '100%',
                    my: '2',
                    background: 'subtle-border-color'
                  }}
                />
                <Flex align="start" justify="between">
                  <Text style="subtitle2" color="subtle">
                    Transfer Time
                  </Text>
                  <Flex css={{ gap: '1' }}>
                    <FontAwesomeIcon
                      icon={faClock}
                      width={16}
                      style={{
                        color: timeEstimate.time < 30 ? '#30A46C' : '#FFA01C'
                      }}
                    />
                    <Text style="subtitle2">~{timeEstimate.formattedTime}</Text>
                  </Flex>
                </Flex>
                <FeeBreakdown feeBreakdown={feeBreakdown} />
              </StyledCollapsibleContent>
            </Collapsible.Root>
          </Box>
        ) : null}
        <WidgetErrorWell
          hasInsufficientBalance={hasInsufficientBalance}
          hasInsufficientSafeBalance={false}
          error={error}
          quote={quote as Execute}
          currency={fromToken}
          isHighRelayerServiceFee={highRelayerServiceFee}
          relayerFeeProportion={relayerFeeProportion}
          context="swap"
        />
        {isMounted && address ? (
          <Button
            css={{ justifyContent: 'center' }}
            aria-label="Swap"
            disabled={
              !quote ||
              hasInsufficientBalance ||
              isInsufficientLiquidityError ||
              steps !== null ||
              waitingForSteps ||
              Number(debouncedInputAmountValue) === 0 ||
              Number(debouncedOutputAmountValue) === 0
            }
            onClick={swap}
          >
            {ctaCopy}
          </Button>
        ) : (
          <Button
            css={{ justifyContent: 'center' }}
            aria-label="Connect wallet"
            onClick={() => {
              if (!onConnectWallet) {
                throw 'Missing onWalletConnect function'
              }
              onConnectWallet()
              onAnalyticEvent?.(EventNames.CONNECT_WALLET_CLICKED, {
                context: 'bridge'
              })
            }}
          >
            Connect
          </Button>
        )}
        {isMounted ? (
          <SwapModal
            open={steps !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSteps(null)
                setDetails(null)
                setSwapError(null)
              }
            }}
            fromToken={fromToken}
            toToken={toToken}
            error={swapError}
            steps={steps}
            details={details}
            fees={quote?.fees}
            address={address}
            onAnalyticEvent={onAnalyticEvent}
          />
        ) : null}
        <CustomAddressModal
          open={addressModalOpen}
          onAnalyticEvent={onAnalyticEvent}
          onOpenChange={(open) => {
            setAddressModalOpen(open)
          }}
          onConfirmed={(address) => {
            setCustomToAddress(address)
          }}
          onClear={() => {
            setCustomToAddress(undefined)
          }}
        />
        {!providerOptionsContext.disablePoweredByReservoir && (
          <Flex
            align="center"
            css={{
              mx: 'auto',
              alignItems: 'center',
              justifyContent: 'center',
              pt: 12
            }}
          >
            <Text
              style="subtitle3"
              color="subtle"
              css={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                lineHeight: '12px',
                fontWeight: 400,
                color: 'text-subtle'
              }}
            >
              Powered by{' '}
              <Anchor
                href="https://reservoir.tools/"
                target="_blank"
                weight="heavy"
                color="gray"
                css={{
                  height: 12,
                  fontSize: 14,
                  '&:hover': {
                    color: '$neutralSolid',
                    fill: '$neutralSolid'
                  }
                }}
              >
                Reservoir
              </Anchor>
            </Text>
          </Flex>
        )}
      </Flex>
    </motion.div>
  )
}

export default SwapWidget
