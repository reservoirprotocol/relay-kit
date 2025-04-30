import type {
  ComponentPropsWithoutRef,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction
} from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  useCurrencyBalance,
  useENSResolver,
  useRelayClient,
  useDebounceState,
  useWalletAddress,
  useDisconnected,
  usePreviousValueChange,
  useIsWalletCompatible,
  useFallbackState,
  useGasTopUpRequired
} from '../../hooks/index.js'
import type { Address, WalletClient } from 'viem'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'
import { useCapabilities } from 'wagmi/experimental'
import type { BridgeFee, Token } from '../../types/index.js'
import { useQueryClient } from '@tanstack/react-query'
import type { ChainVM, Execute } from '@reservoir0x/relay-sdk'
import {
  calculatePriceTimeEstimate,
  calculateRelayerFeeProportionUsd,
  extractQuoteId,
  isHighRelayerServiceFeeUsd,
  parseFees
} from '../../utils/quote.js'
import { useQuote } from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../constants/events.js'
import { ProviderOptionsContext } from '../../providers/RelayKitProvider.js'
import type { DebouncedState } from 'usehooks-ts'
import type Text from '../../components/primitives/Text.js'
import type { AdaptedWallet } from '@reservoir0x/relay-sdk'
import type { LinkedWallet } from '../../types/index.js'
import {
  addressWithFallback,
  isValidAddress,
  findSupportedWallet
} from '../../utils/address.js'
import { adaptViemWallet, getDeadAddress } from '@reservoir0x/relay-sdk'
import { errorToJSON } from '../../utils/errors.js'
import { useSwapButtonCta } from '../../hooks/widget/useSwapButtonCta.js'

export type TradeType = 'EXACT_INPUT' | 'EXPECTED_OUTPUT'

type SwapWidgetRendererProps = {
  transactionModalOpen: boolean
  setTransactionModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  depositAddressModalOpen: boolean
  children: (props: ChildrenProps) => ReactNode
  fromToken?: Token
  setFromToken?: (token?: Token) => void
  toToken?: Token
  setToToken?: (token?: Token) => void
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: TradeType
  slippageTolerance?: string
  context: 'Swap' | 'Deposit' | 'Withdraw'
  wallet?: AdaptedWallet
  linkedWallets?: LinkedWallet[]
  multiWalletSupportEnabled?: boolean
  supportedWalletVMs: ChainVM[]
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapError?: (error: string, data?: Execute) => void
}

export type ChildrenProps = {
  quote?: ReturnType<typeof useQuote>['data']
  steps: Execute['steps'] | null
  setSteps: Dispatch<React.SetStateAction<Execute['steps'] | null>>
  swap: () => void
  transactionModalOpen: boolean
  details: null | Execute['details']
  feeBreakdown: {
    breakdown: BridgeFee[]
    totalFees: {
      usd?: string
      priceImpactPercentage?: string
      priceImpact?: string
      priceImpactColor?: ComponentPropsWithoutRef<typeof Text>['color']
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
  address?: Address | string
  recipient?: Address | string
  customToAddress?: Address | string
  setCustomToAddress: Dispatch<
    React.SetStateAction<Address | string | undefined>
  >
  tradeType: TradeType
  setTradeType: Dispatch<React.SetStateAction<TradeType>>
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
  toBalancePending?: boolean
  fromBalance?: bigint
  fromBalancePending?: boolean
  isFetchingQuote: boolean
  isLoadingToBalance: boolean
  isLoadingFromBalance: boolean
  highRelayerServiceFee: boolean
  relayerFeeProportion: bigint
  hasInsufficientBalance: boolean
  isInsufficientLiquidityError?: boolean
  isCapacityExceededError?: boolean
  isCouldNotExecuteError?: boolean
  ctaCopy: string
  isFromNative: boolean
  useExternalLiquidity: boolean
  slippageTolerance?: string
  supportsExternalLiquidity: boolean
  timeEstimate?: { time: number; formattedTime: string }
  canonicalTimeEstimate?: { time: number; formattedTime: string }
  fetchingExternalLiquiditySupport: boolean
  isSvmSwap: boolean
  isBvmSwap: boolean
  isValidFromAddress: boolean
  isValidToAddress: boolean
  supportedWalletVMs: ChainVM[]
  fromChainWalletVMSupported: boolean
  toChainWalletVMSupported: boolean
  isRecipientLinked?: boolean
  recipientWalletSupportsChain?: boolean
  gasTopUpEnabled: boolean
  setGasTopUpEnabled: Dispatch<React.SetStateAction<boolean>>
  gasTopUpRequired: boolean
  gasTopUpAmount?: bigint
  gasTopUpAmountUsd?: string
  invalidateBalanceQueries: () => void
  invalidateQuoteQuery: () => void
  setUseExternalLiquidity: Dispatch<React.SetStateAction<boolean>>
  setDetails: Dispatch<React.SetStateAction<Execute['details'] | null>>
  setSwapError: Dispatch<React.SetStateAction<Error | null>>
}

const SwapWidgetRenderer: FC<SwapWidgetRendererProps> = ({
  transactionModalOpen,
  setTransactionModalOpen,
  depositAddressModalOpen,
  fromToken: _fromToken,
  setFromToken: _setFromToken,
  toToken: _toToken,
  setToToken: _setToToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  slippageTolerance,
  context,
  wallet,
  multiWalletSupportEnabled = false,
  linkedWallets,
  supportedWalletVMs,
  children,
  onAnalyticEvent,
  onSwapError
}) => {
  const [fromToken, setFromToken] = useFallbackState(
    _setFromToken ? _fromToken : undefined,
    _setFromToken
      ? [
          _fromToken,
          _setFromToken as Dispatch<SetStateAction<Token | undefined>>
        ]
      : undefined
  )
  const [toToken, setToToken] = useFallbackState(
    _setToToken ? _toToken : undefined,
    _setToToken
      ? [_toToken, _setToToken as Dispatch<SetStateAction<Token | undefined>>]
      : undefined
  )
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const connectorKeyOverrides = providerOptionsContext.vmConnectorKeyOverrides
  const relayClient = useRelayClient()
  const { connector } = useAccount()
  const walletClient = useWalletClient()
  const [customToAddress, setCustomToAddress] = useState<
    Address | string | undefined
  >(defaultToAddress)
  const [useExternalLiquidity, setUseExternalLiquidity] =
    useState<boolean>(false)
  const address = useWalletAddress(wallet, linkedWallets)

  const [tradeType, setTradeType] = useState<'EXACT_INPUT' | 'EXPECTED_OUTPUT'>(
    defaultTradeType ?? 'EXACT_INPUT'
  )
  const queryClient = useQueryClient()
  const [steps, setSteps] = useState<null | Execute['steps']>(null)
  const [waitingForSteps, setWaitingForSteps] = useState(false)
  const [details, setDetails] = useState<null | Execute['details']>(null)
  const [gasTopUpEnabled, setGasTopUpEnabled] = useState(true)

  const {
    value: amountInputValue,
    debouncedValue: debouncedInputAmountValue,
    setValue: setAmountInputValue,
    debouncedControls: debouncedAmountInputControls
  } = useDebounceState<string>(
    !defaultTradeType || defaultTradeType === 'EXACT_INPUT'
      ? (defaultAmount ?? '')
      : '',
    500
  )
  const {
    value: amountOutputValue,
    debouncedValue: debouncedOutputAmountValue,
    setValue: setAmountOutputValue,
    debouncedControls: debouncedAmountOutputControls
  } = useDebounceState<string>(
    defaultTradeType === 'EXPECTED_OUTPUT' ? (defaultAmount ?? '') : '',
    500
  )

  const [swapError, setSwapError] = useState<Error | null>(null)
  const tokenPairIsCanonical =
    fromToken?.chainId !== undefined &&
    toToken?.chainId !== undefined &&
    fromToken.symbol === toToken.symbol

  const toChain = relayClient?.chains.find(
    (chain) => chain.id === toToken?.chainId
  )
  const fromChain = relayClient?.chains?.find(
    (chain) => chain.id === fromToken?.chainId
  )

  const fromChainWalletVMSupported =
    !fromChain?.vmType || supportedWalletVMs.includes(fromChain?.vmType)
  const toChainWalletVMSupported =
    !toChain?.vmType || supportedWalletVMs.includes(toChain?.vmType)

  const defaultRecipient = useMemo(() => {
    const _linkedWallet = linkedWallets?.find(
      (linkedWallet) =>
        address ===
        (linkedWallet.vmType === 'evm'
          ? linkedWallet.address.toLowerCase()
          : linkedWallet.address)
    )
    const _isValidToAddress = isValidAddress(
      toChain?.vmType,
      customToAddress ?? '',
      toChain?.id,
      !customToAddress && _linkedWallet?.address === address
        ? _linkedWallet?.connector
        : undefined,
      connectorKeyOverrides
    )
    if (
      multiWalletSupportEnabled &&
      toChain &&
      linkedWallets &&
      !_isValidToAddress
    ) {
      const supportedAddress = findSupportedWallet(
        toChain,
        customToAddress,
        linkedWallets,
        connectorKeyOverrides
      )

      return supportedAddress
    }
  }, [
    multiWalletSupportEnabled,
    toChain,
    customToAddress,
    address,
    linkedWallets,
    setCustomToAddress
  ])

  const recipient = customToAddress ?? defaultRecipient ?? address

  const {
    value: fromBalance,
    queryKey: fromBalanceQueryKey,
    isLoading: isLoadingFromBalance,
    isError: fromBalanceErrorFetching,
    isDuneBalance: fromBalanceIsDune,
    hasPendingBalance: fromBalancePending
  } = useCurrencyBalance({
    chain: fromChain,
    address: address,
    currency: fromToken?.address ? (fromToken.address as Address) : undefined,
    enabled: fromToken !== undefined
  })

  const {
    value: toBalance,
    queryKey: toBalanceQueryKey,
    isLoading: isLoadingToBalance,
    isDuneBalance: toBalanceIsDune,
    hasPendingBalance: toBalancePending
  } = useCurrencyBalance({
    chain: toChain,
    address: recipient,
    currency: toToken?.address ? (toToken.address as Address) : undefined,
    enabled: toToken !== undefined
  })

  const invalidateBalanceQueries = useCallback(() => {
    const invalidatePeriodically = (invalidateFn: () => void) => {
      let maxRefreshes = 4
      let refreshCount = 0
      const timer = setInterval(() => {
        if (maxRefreshes === refreshCount) {
          clearInterval(timer)
          return
        }
        refreshCount++
        invalidateFn()
      }, 3000)
    }

    queryClient.invalidateQueries({ queryKey: ['useDuneBalances'] })

    // Dune balances are sometimes stale, because of this we need to aggressively fetch them
    // for a predetermined period to make sure we get back a fresh response
    if (fromBalanceIsDune) {
      invalidatePeriodically(() => {
        queryClient.invalidateQueries({ queryKey: fromBalanceQueryKey })
      })
    } else {
      queryClient.invalidateQueries({ queryKey: fromBalanceQueryKey })
    }
    if (toBalanceIsDune) {
      invalidatePeriodically(() => {
        queryClient.invalidateQueries({ queryKey: toBalanceQueryKey })
      })
    } else {
      queryClient.invalidateQueries({ queryKey: toBalanceQueryKey })
    }
  }, [
    queryClient,
    fromBalanceQueryKey,
    toBalanceQueryKey,
    toBalanceIsDune,
    fromBalanceIsDune,
    address
  ])
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

  const isSvmSwap = fromChain?.vmType === 'svm' || toChain?.vmType === 'svm'
  const isBvmSwap = fromChain?.vmType === 'bvm' || toChain?.vmType === 'bvm'
  const linkedWallet = linkedWallets?.find(
    (linkedWallet) => address === linkedWallet.address
  )
  const isRecipientLinked =
    (recipient
      ? linkedWallets?.find((wallet) => wallet.address === recipient)
      : undefined) !== undefined

  const isValidFromAddress = isValidAddress(
    fromChain?.vmType,
    address ?? '',
    fromChain?.id,
    linkedWallet?.connector,
    connectorKeyOverrides
  )
  const fromAddressWithFallback = addressWithFallback(
    fromChain?.vmType,
    address,
    fromChain?.id,
    linkedWallet?.connector,
    connectorKeyOverrides
  )

  const isValidToAddress = isValidAddress(
    toChain?.vmType,
    recipient ?? '',
    toChain?.id
  )

  const toAddressWithFallback = addressWithFallback(
    toChain?.vmType,
    recipient,
    toChain?.id
  )

  const externalLiquiditySupport = useQuote(
    relayClient ? relayClient : undefined,
    wallet,
    fromToken && toToken
      ? {
          user: getDeadAddress(fromChain?.vmType, fromChain?.id),
          originChainId: fromToken.chainId,
          destinationChainId: toToken.chainId,
          originCurrency: fromToken.address,
          destinationCurrency: toToken.address,
          recipient: getDeadAddress(toChain?.vmType, toChain?.id),
          tradeType,
          appFees: providerOptionsContext.appFees,
          amount: '10000000000000000000000', //Hardcode an extremely high number
          referrer: relayClient?.source ?? undefined,
          useExternalLiquidity: true
        }
      : undefined,
    undefined,
    undefined,
    {
      refetchOnWindowFocus: false,
      enabled:
        fromToken !== undefined &&
        toToken !== undefined &&
        fromChain &&
        toChain &&
        (fromChain.id === toChain.baseChainId ||
          toChain.id === fromChain.baseChainId)
    }
  )
  const supportsExternalLiquidity =
    tokenPairIsCanonical &&
    externalLiquiditySupport.status === 'success' &&
    fromChainWalletVMSupported
      ? true
      : false

  const { displayName: toDisplayName } = useENSResolver(recipient, {
    enabled: toChain?.vmType === 'evm' && isValidToAddress
  })

  const [currentSlippageTolerance, setCurrentSlippageTolerance] = useState<
    string | undefined
  >(slippageTolerance)

  useEffect(() => {
    setCurrentSlippageTolerance(slippageTolerance)
  }, [slippageTolerance])

  const {
    required: gasTopUpRequired,
    amount: _gasTopUpAmount,
    amountUsd: _gasTopUpAmountUsd
  } = useGasTopUpRequired(toChain, fromChain, toToken, recipient)

  const quoteParameters =
    fromToken && toToken
      ? {
          user: fromAddressWithFallback,
          originChainId: fromToken.chainId,
          destinationChainId: toToken.chainId,
          originCurrency: fromToken.address,
          destinationCurrency: toToken.address,
          recipient: toAddressWithFallback,
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
          referrer: relayClient?.source ?? undefined,
          useExternalLiquidity,
          useDepositAddress: !fromChainWalletVMSupported,
          slippageTolerance: slippageTolerance,
          topupGas: gasTopUpEnabled && gasTopUpRequired
        }
      : undefined

  const onQuoteRequested: Parameters<typeof useQuote>['3'] = (
    options,
    config
  ) => {
    onAnalyticEvent?.(EventNames.QUOTE_REQUESTED, {
      parameters: options,
      httpConfig: config
    })
  }

  const onQuoteReceived: Parameters<typeof useQuote>['4'] = ({
    details,
    steps
  }) => {
    onAnalyticEvent?.(EventNames.QUOTE_RECEIVED, {
      wallet_connector: connector?.name,
      amount_in: details?.currencyIn?.amountFormatted,
      currency_in: details?.currencyIn?.currency?.symbol,
      chain_id_in: details?.currencyIn?.currency?.chainId,
      amount_out: details?.currencyOut?.amountFormatted,
      currency_out: details?.currencyOut?.currency?.symbol,
      chain_id_out: details?.currencyOut?.currency?.chainId,
      is_canonical: useExternalLiquidity,
      slippage_tolerance_destination_percentage:
        details?.slippageTolerance?.destination?.percent,
      slippage_tolerance_origin_percentage:
        details?.slippageTolerance?.origin?.percent,
      steps
    })
  }

  const quoteFetchingEnabled = Boolean(
    relayClient &&
      ((tradeType === 'EXACT_INPUT' &&
        debouncedInputAmountValue &&
        debouncedInputAmountValue.length > 0 &&
        Number(debouncedInputAmountValue) !== 0) ||
        (tradeType === 'EXPECTED_OUTPUT' &&
          debouncedOutputAmountValue &&
          debouncedOutputAmountValue.length > 0 &&
          Number(debouncedOutputAmountValue) !== 0)) &&
      fromToken !== undefined &&
      toToken !== undefined &&
      !transactionModalOpen &&
      !depositAddressModalOpen
  )

  const {
    data: _quoteData,
    error: quoteError,
    isLoading: isFetchingQuote,
    executeQuote: executeSwap,
    queryKey: quoteQueryKey
  } = useQuote(
    relayClient ? relayClient : undefined,
    wallet,
    quoteParameters,
    onQuoteRequested,
    onQuoteReceived,
    {
      refetchOnWindowFocus: false,
      enabled: quoteFetchingEnabled,
      refetchInterval:
        !transactionModalOpen &&
        !depositAddressModalOpen &&
        debouncedInputAmountValue === amountInputValue &&
        debouncedOutputAmountValue === amountOutputValue
          ? 12000
          : undefined
    },
    (e: any) => {
      const errorMessage = errorToJSON(
        e?.response?.data?.message ? new Error(e?.response?.data?.message) : e
      )
      onAnalyticEvent?.(EventNames.QUOTE_ERROR, {
        wallet_connector: connector?.name,
        error_message: errorMessage,
        parameters: quoteParameters
      })
    }
  )

  const invalidateQuoteQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: quoteQueryKey })
  }, [queryClient, quoteQueryKey])
  let error =
    _quoteData || (isFetchingQuote && quoteFetchingEnabled) ? null : quoteError
  let quote = error ? undefined : _quoteData
  const gasTopUpAmount = quote?.details?.currencyGasTopup?.amount
    ? BigInt(quote?.details?.currencyGasTopup?.amount)
    : _gasTopUpAmount
  const gasTopUpAmountUsd =
    quote?.details?.currencyGasTopup?.amountUsd ?? _gasTopUpAmountUsd

  useDisconnected(address, () => {
    setCustomToAddress(undefined)
  })

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
    } else if (tradeType === 'EXPECTED_OUTPUT') {
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

  useEffect(() => {
    if (
      useExternalLiquidity &&
      !externalLiquiditySupport.isFetching &&
      !supportsExternalLiquidity
    ) {
      setUseExternalLiquidity(false)
    }
  }, [
    supportsExternalLiquidity,
    useExternalLiquidity,
    externalLiquiditySupport.isFetching
  ])

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
      !hasAuxiliaryFundsSupport &&
      fromChainWalletVMSupported
  )

  const fetchQuoteErrorMessage = error
    ? error?.message
      ? (error?.message as string)
      : 'Unknown Error'
    : null
  const fetchQuoteDataErrorMessage = error
    ? (error as any)?.response?.data?.message
      ? ((error as any)?.response?.data.message as string)
      : 'Unknown Error'
    : null
  const isInsufficientLiquidityError = Boolean(
    fetchQuoteErrorMessage?.includes('No quotes available')
  )
  const isCapacityExceededError =
    fetchQuoteDataErrorMessage?.includes(
      'Amount is higher than the available liquidity'
    ) || fetchQuoteDataErrorMessage?.includes('Insufficient relayer liquidity')
  const isCouldNotExecuteError =
    fetchQuoteDataErrorMessage?.includes('Could not execute')
  const highRelayerServiceFee = isHighRelayerServiceFeeUsd(quote)
  const relayerFeeProportion = calculateRelayerFeeProportionUsd(quote)
  const timeEstimate = calculatePriceTimeEstimate(quote?.details)
  const canonicalTimeEstimate = calculatePriceTimeEstimate(
    externalLiquiditySupport.data?.details
  )

  const recipientWalletSupportsChain = useIsWalletCompatible(
    toChain?.id,
    recipient,
    linkedWallets
  )

  const isFromNative = fromToken?.address === fromChain?.currency?.address

  const isSameCurrencySameRecipientSwap =
    fromToken?.address === toToken?.address &&
    fromToken?.chainId === toToken?.chainId &&
    address === recipient

  const ctaCopy = useSwapButtonCta({
    fromToken,
    toToken,
    multiWalletSupportEnabled,
    isValidFromAddress,
    fromChainWalletVMSupported,
    isValidToAddress,
    toChainWalletVMSupported,
    fromChain,
    toChain,
    isSameCurrencySameRecipientSwap,
    debouncedInputAmountValue,
    debouncedOutputAmountValue,
    hasInsufficientBalance,
    isInsufficientLiquidityError,
    quote,
    operation: quote?.details?.operation
  })

  usePreviousValueChange(
    isCapacityExceededError && supportsExternalLiquidity,
    !isFetchingQuote && !externalLiquiditySupport.isFetching,
    (capacityExceeded) => {
      if (capacityExceeded) {
        onAnalyticEvent?.(EventNames.CTA_MAX_CAPACITY_PROMPTED, {
          inputAmount: debouncedInputAmountValue,
          outputAmount: debouncedOutputAmountValue
        })
      }
    }
  )

  const swap = useCallback(async () => {
    const swapErrorHandler = (error: any) => {
      if (
        error &&
        ((typeof error.message === 'string' &&
          error.message.includes('rejected')) ||
          (typeof error === 'string' && error.includes('rejected')) ||
          (typeof error === 'string' && error.includes('Approval Denied')) ||
          (typeof error === 'string' && error.includes('denied transaction')) ||
          (typeof error.message === 'string' &&
            error.message.includes('Approval Denied')) ||
          (typeof error.message === 'string' &&
            error.message.includes('Plugin Closed')) ||
          (typeof error.message === 'string' &&
            error.message.includes('denied transaction')) ||
          (typeof error.message === 'string' &&
            error.message.includes('Failed to initialize request') &&
            fromChain?.id === 2741)) // Abstract @TODO: remove once privy improves handling rejected transactions
      ) {
        // Close the transaction modal if the user rejects the tx
        setTransactionModalOpen(false)
        onAnalyticEvent?.(EventNames.USER_REJECTED_WALLET)
        return
      }

      const errorMessage = errorToJSON(
        error?.response?.data?.message
          ? new Error(error?.response?.data?.message)
          : error
      )

      onAnalyticEvent?.(EventNames.SWAP_ERROR, {
        error_message: errorMessage,
        wallet_connector: connector?.name,
        quote_id: extractQuoteId(steps ?? (quote?.steps as Execute['steps'])),
        amount_in: parseFloat(`${debouncedInputAmountValue}`),
        currency_in: fromToken?.symbol,
        chain_id_in: fromToken?.chainId,
        amount_out: parseFloat(`${debouncedOutputAmountValue}`),
        currency_out: toToken?.symbol,
        chain_id_out: toToken?.chainId,
        is_canonical: useExternalLiquidity,
        txHashes: (steps ?? (quote?.steps as Execute['steps']))
          ?.map((step) => {
            let txHashes: { chainId: number; txHash: string }[] = []
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
    }

    try {
      onAnalyticEvent?.(EventNames.SWAP_CTA_CLICKED, {
        quote_id: quote?.steps ? extractQuoteId(quote.steps) : undefined
      })
      setWaitingForSteps(true)

      if (!executeSwap) {
        throw 'Missing a quote'
      }

      if (!wallet && !walletClient.data) {
        throw 'Missing a wallet'
      }

      setSteps(quote?.steps as Execute['steps'])
      setTransactionModalOpen(true)

      const _wallet =
        wallet ?? adaptViemWallet(walletClient.data as WalletClient)

      const activeWalletChainId = await _wallet?.getChainId()
      if (fromToken && fromToken?.chainId !== activeWalletChainId) {
        onAnalyticEvent?.(EventNames.SWAP_SWITCH_NETWORK, {
          activeWalletChainId,
          chainId: fromToken.chainId,
          quote_id: quote?.steps ? extractQuoteId(quote.steps) : undefined
        })
        await _wallet?.switchChain(fromToken.chainId)
      }

      executeSwap(({ steps: currentSteps }) => {
        setSteps(currentSteps)
      })
        ?.catch((error: any) => {
          swapErrorHandler(error)
        })
        .finally(() => {
          setWaitingForSteps(false)
          invalidateBalanceQueries()
        })
    } catch (error: any) {
      swapErrorHandler(error)
      setWaitingForSteps(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    relayClient,
    address,
    connector,
    wallet,
    walletClient,
    fromToken,
    toToken,
    customToAddress,
    recipient,
    debouncedInputAmountValue,
    debouncedOutputAmountValue,
    tradeType,
    useExternalLiquidity,
    waitingForSteps,
    executeSwap,
    setSteps,
    invalidateBalanceQueries
  ])

  return (
    <>
      {children({
        quote,
        steps,
        setSteps,
        swap,
        transactionModalOpen,
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
        tradeType,
        setTradeType,
        details,
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
        toBalancePending,
        isLoadingToBalance,
        isFetchingQuote,
        isLoadingFromBalance,
        fromBalance,
        fromBalancePending,
        highRelayerServiceFee,
        relayerFeeProportion,
        hasInsufficientBalance,
        isInsufficientLiquidityError,
        isCapacityExceededError,
        isCouldNotExecuteError,
        ctaCopy,
        isFromNative,
        useExternalLiquidity,
        slippageTolerance: currentSlippageTolerance,
        supportsExternalLiquidity,
        timeEstimate,
        canonicalTimeEstimate,
        fetchingExternalLiquiditySupport: externalLiquiditySupport.isFetching,
        isSvmSwap,
        isBvmSwap,
        isValidFromAddress,
        isValidToAddress,
        supportedWalletVMs,
        fromChainWalletVMSupported,
        toChainWalletVMSupported,
        isRecipientLinked,
        recipientWalletSupportsChain,
        gasTopUpEnabled,
        setGasTopUpEnabled,
        gasTopUpRequired,
        gasTopUpAmount,
        gasTopUpAmountUsd,
        invalidateBalanceQueries,
        invalidateQuoteQuery,
        setUseExternalLiquidity,
        setDetails,
        setSwapError
      })}
    </>
  )
}

export default SwapWidgetRenderer
