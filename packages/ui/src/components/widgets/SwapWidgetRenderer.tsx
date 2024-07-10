import type { Dispatch, FC, ReactNode } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  useCurrencyBalance,
  useENSResolver,
  useRelayClient,
  useDebounceState
} from '../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useConfig, useWalletClient } from 'wagmi'
import { useCapabilities } from 'wagmi/experimental'
import type { BridgeFee, Token } from '../../types/index.js'
import { useQueryClient } from '@tanstack/react-query'
import { deadAddress } from '../../constants/address.js'
import type { Execute } from '@reservoir0x/relay-sdk'
import {
  calculateRelayerFeeProportionUsd,
  calculateTimeEstimate,
  extractQuoteId,
  isHighRelayerServiceFeeUsd,
  parseFees
} from '../../utils/quote.js'
import { switchChain } from 'wagmi/actions'
import { useQuote, useRelayConfig } from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../constants/events.js'
import { ProviderOptionsContext } from '../../providers/RelayKitProvider.js'
import type { DebouncedState } from 'usehooks-ts'

type TradeType = 'EXACT_INPUT' | 'EXACT_OUTPUT'

type SwapWidgetRendererProps = {
  children: (props: ChildrenProps) => ReactNode
  defaultFromToken?: Token
  defaultToToken?: Token
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: TradeType
  fetchSolverConfig?: boolean
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapError?: (error: string, data?: Execute) => void
  context: 'Swap' | 'Deposit' | 'Withdraw'
}

export type ChildrenProps = {
  quote?: ReturnType<typeof useQuote>['data']
  steps: null | Execute['steps']
  details: null | Execute['details']
  feeBreakdown: {
    breakdown: BridgeFee[]
    totalFees: {
      usd?: string
      priceImpactPercentage?: string
      priceImpact?: string
      swapImpact?: string
    }
  } | null
  fromToken?: Token
  setFromToken: Dispatch<React.SetStateAction<Token | undefined>>
  toToken?: Token
  setToToken: Dispatch<React.SetStateAction<Token | undefined>>
  swapError: Error | null
  error: Error | null
  toDisplayName?: string
  address?: Address
  recipient?: Address
  customToAddress?: Address
  setCustomToAddress: Dispatch<React.SetStateAction<Address | undefined>>
  swap: () => void
  tradeType: TradeType
  setTradeType: Dispatch<React.SetStateAction<TradeType>>
  waitingForSteps: boolean
  isSameCurrencySameRecipientSwap: boolean
  amountInputValue: string
  debouncedInputAmountValue: string
  setAmountInputValue: (value: string) => void
  debouncedAmountInputControls: DebouncedState<(value: string) => void>
  amountOutputValue: string
  debouncedOutputAmountValue: string
  setAmountOutputValue: (value: string) => void
  debouncedAmountOutputControls: DebouncedState<(value: string) => void>
  toBalance?: bigint
  fromBalance?: bigint
  isFetchingQuote: boolean
  isLoadingToBalance: boolean
  isLoadingFromBalance: boolean
  highRelayerServiceFee: boolean
  relayerFeeProportion: bigint
  hasInsufficientBalance: boolean
  isInsufficientLiquidityError?: boolean
  ctaCopy: string
  isFromETH: boolean
  useExternalLiquidity: boolean
  supportsExternalLiquidity: boolean
  timeEstimate?: { time: number; formattedTime: string }
  setUseExternalLiquidity: Dispatch<React.SetStateAction<boolean>>
  setSteps: Dispatch<React.SetStateAction<Execute['steps'] | null>>
  setDetails: Dispatch<React.SetStateAction<Execute['details'] | null>>
  setSwapError: Dispatch<React.SetStateAction<Error | null>>
}

const SwapWidgetRenderer: FC<SwapWidgetRendererProps> = ({
  defaultFromToken,
  defaultToToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  context,
  fetchSolverConfig,
  children,
  onAnalyticEvent,
  onSwapError
}) => {
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const wagmiConfig = useConfig()
  const relayClient = useRelayClient()
  const walletClient = useWalletClient()
  const { address, chainId: activeWalletChainId, connector } = useAccount()
  const [customToAddress, setCustomToAddress] = useState<Address | undefined>(
    defaultToAddress
  )
  const [useExternalLiquidity, setUseExternalLiquidity] =
    useState<boolean>(false)
  const recipient = customToAddress ?? address
  const { displayName: toDisplayName } = useENSResolver(recipient)
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

  const [swapError, setSwapError] = useState<Error | null>(null)
  const [fromToken, setFromToken] = useState<Token | undefined>(
    defaultFromToken
  )
  const [toToken, setToToken] = useState<Token | undefined>(defaultToToken)
  const canonicalCurrencies: string[] = [
    'degen',
    'eth',
    'usdc',
    'xai',
    'sipher'
  ]
  const tokenPairIsCanonical =
    fromToken?.chainId !== undefined &&
    toToken?.chainId !== undefined &&
    fromToken.symbol === toToken.symbol &&
    canonicalCurrencies.includes(fromToken.symbol.toLowerCase())
  const config = useRelayConfig(
    relayClient?.baseApiUrl,
    {
      currency: ((fromToken?.symbol as any) ?? '').toLowerCase(),
      originChainId: `${fromToken?.chainId}`,
      destinationChainId: `${toToken?.chainId}`
    },
    {
      enabled: tokenPairIsCanonical && fetchSolverConfig
    }
  )
  const supportsExternalLiquidity =
    tokenPairIsCanonical && config.data?.supportsExternalLiquidity
      ? true
      : false
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
    address: recipient,
    currency: toToken?.address ? (toToken.address as Address) : undefined,
    enabled: toToken !== undefined
  })

  const invalidateBalanceQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: fromBalanceQueryKey })
    queryClient.invalidateQueries({ queryKey: toBalanceQueryKey })
    queryClient.invalidateQueries({ queryKey: ['useDuneBalances'] })
  }, [queryClient, fromBalanceQueryKey, toBalanceQueryKey, address])
  const { data: capabilities } = useCapabilities({
    query: {
      enabled:
        connector &&
        (connector.id === 'coinbaseWalletSDK' || connector.id === 'coinbase')
    }
  })
  const hasAuxiliaryFundsSupport = Boolean(
    fromToken?.chainId
      ? capabilities?.[fromToken?.chainId]?.auxiliaryFunds?.supported
      : false
  )

  const {
    data: quote,
    isLoading: isFetchingQuote,
    executeQuote: executeSwap,
    error
  } = useQuote(
    relayClient ? relayClient : undefined,
    walletClient.data,
    fromToken && toToken
      ? {
          user: address ?? deadAddress,
          originChainId: fromToken.chainId,
          destinationChainId: toToken.chainId,
          originCurrency: fromToken.address,
          destinationCurrency: toToken.address,
          recipient: recipient as string,
          tradeType,
          appFees: providerOptionsContext.appFees,
          amount:
            tradeType === 'EXACT_INPUT'
              ? parseUnits(
                  debouncedInputAmountValue,
                  fromToken.decimals
                ).toString()
              : parseUnits(
                  debouncedOutputAmountValue,
                  toToken.decimals
                ).toString(),
          source: relayClient?.source ?? undefined,
          useExternalLiquidity
        }
      : undefined,
    () => {},
    ({ steps, details }) => {
      onAnalyticEvent?.(EventNames.SWAP_EXECUTE_QUOTE_RECEIVED, {
        wallet_connector: connector?.name,
        quote_id: steps ? extractQuoteId(steps) : undefined,
        amount_in: details?.currencyIn?.amountFormatted,
        currency_in: details?.currencyIn?.currency?.symbol,
        chain_id_in: details?.currencyIn?.currency?.chainId,
        amount_out: details?.currencyOut?.amountFormatted,
        currency_out: details?.currencyOut?.currency?.symbol,
        chain_id_out: details?.currencyOut?.currency?.chainId
      })
    },
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
      ? parseFees(toChain, fromChain, quote)
      : null
  }, [quote, fromToken, toToken, relayClient])

  const totalAmount = BigInt(quote?.details?.currencyIn?.amount ?? 0n)

  const hasInsufficientBalance = Boolean(
    !fromBalanceErrorFetching &&
      totalAmount &&
      address &&
      (fromBalance ?? 0n) < totalAmount &&
      !hasAuxiliaryFundsSupport
  )

  const fetchQuoteErrorMessage = error
    ? error?.message
      ? (error?.message as string)
      : 'Unknown Error'
    : null
  const isInsufficientLiquidityError = fetchQuoteErrorMessage?.includes(
    'No quotes available'
  )
  const highRelayerServiceFee = isHighRelayerServiceFeeUsd(quote)
  const relayerFeeProportion = calculateRelayerFeeProportionUsd(quote)
  const timeEstimate = calculateTimeEstimate(quote?.breakdown)

  const isFromETH = fromToken?.symbol === 'ETH'

  const isWrap =
    isFromETH &&
    toToken?.symbol === 'WETH' &&
    fromToken.chainId === toToken.chainId
  const isUnwrap =
    fromToken?.symbol === 'WETH' &&
    toToken?.symbol === 'ETH' &&
    fromToken.chainId === toToken.chainId

  const isSameCurrencySameRecipientSwap =
    fromToken?.address === toToken?.address &&
    fromToken?.chainId === toToken?.chainId &&
    address === recipient

  let ctaCopy: string = context || 'Swap'

  if (context === 'Swap') {
    if (isWrap) {
      ctaCopy = 'Wrap'
    } else if (isUnwrap) {
      ctaCopy = 'Unwrap'
    }
  }

  if (!fromToken || !toToken) {
    ctaCopy = 'Select a token'
  } else if (isSameCurrencySameRecipientSwap) {
    ctaCopy = 'Invalid recipient'
  } else if (!debouncedInputAmountValue || !debouncedOutputAmountValue) {
    ctaCopy = 'Enter an amount'
  } else if (hasInsufficientBalance) {
    ctaCopy = 'Insufficient Balance'
  } else if (isInsufficientLiquidityError) {
    ctaCopy = 'Insufficient Liquidity'
  } else if (steps !== null) {
    if (context === 'Swap') {
      ctaCopy = 'Swapping'
      if (isWrap) {
        ctaCopy = 'Wrapping'
      } else if (isUnwrap) {
        ctaCopy = 'Unwrapping'
      }
    } else {
      ctaCopy = context === 'Deposit' ? 'Depositing' : 'Withdrawing'
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

      executeSwap(({ steps, details }) => {
        setSteps(steps)
        setDetails(details)
      })
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
            chain_id_out: toToken?.chainId,
            is_canonical: useExternalLiquidity,
            txHashes: steps
              ?.map((step) => {
                let txHashes: { chainId: number; txHash: Address }[] = []
                step.items?.forEach((item) => {
                  if (item.txHashes) {
                    txHashes = txHashes.concat([
                      ...(item.txHashes ?? []),
                      ...(item.internalTxHashes ?? [])
                    ])
                  }
                })
                return txHashes
              })
              .flat()
          })
          setSwapError(errorMessage)
          onSwapError?.(errorMessage, quote as Execute)
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
        chain_id_out: toToken?.chainId,
        is_canonical: useExternalLiquidity,
        txHashes: steps
          ?.map((step) => {
            let txHashes: { chainId: number; txHash: Address }[] = []
            step.items?.forEach((item) => {
              if (item.txHashes) {
                txHashes = txHashes.concat([
                  ...(item.txHashes ?? []),
                  ...(item.internalTxHashes ?? [])
                ])
              }
            })
            return txHashes
          })
          .flat()
      })
      onSwapError?.(e as any, quote as Execute)
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
    recipient,
    debouncedInputAmountValue,
    debouncedOutputAmountValue,
    tradeType,
    useExternalLiquidity,
    executeSwap,
    setSteps,
    setDetails,
    invalidateBalanceQueries
  ])

  return (
    <>
      {children({
        quote,
        steps,
        feeBreakdown,
        fromToken,
        setFromToken,
        toToken,
        setToToken,
        swapError,
        error,
        toDisplayName,
        address,
        recipient,
        customToAddress,
        setCustomToAddress,
        swap,
        tradeType,
        setTradeType,
        details,
        waitingForSteps,
        isSameCurrencySameRecipientSwap,
        debouncedInputAmountValue,
        debouncedAmountInputControls,
        setAmountInputValue,
        amountInputValue,
        amountOutputValue,
        debouncedOutputAmountValue,
        debouncedAmountOutputControls,
        setAmountOutputValue,
        toBalance,
        isLoadingToBalance,
        isFetchingQuote,
        isLoadingFromBalance,
        fromBalance,
        highRelayerServiceFee,
        relayerFeeProportion,
        hasInsufficientBalance,
        isInsufficientLiquidityError,
        ctaCopy,
        isFromETH,
        useExternalLiquidity,
        supportsExternalLiquidity,
        timeEstimate,
        setUseExternalLiquidity,
        setSteps,
        setDetails,
        setSwapError
      })}
    </>
  )
}

export default SwapWidgetRenderer
