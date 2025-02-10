import type { ComponentPropsWithoutRef, Dispatch, FC, ReactNode } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  useCurrencyBalance,
  useENSResolver,
  useRelayClient,
  useDebounceState,
  useWalletAddress,
  useDisconnected,
  usePreviousValueChange
} from '../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useCapabilities } from 'wagmi/experimental'
import type { BridgeFee, Token } from '../../types/index.js'
import { useQueryClient } from '@tanstack/react-query'
import type { ChainVM, Execute, RelayChain } from '@reservoir0x/relay-sdk'
import {
  calculatePriceTimeEstimate,
  calculateRelayerFeeProportionUsd,
  extractMaxCapacity,
  isHighRelayerServiceFeeUsd,
  parseFees
} from '../../utils/quote.js'
import { usePrice, useQuote } from '@reservoir0x/relay-kit-hooks'
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
import { getDeadAddress } from '@reservoir0x/relay-sdk'
import { errorToJSON } from '../../utils/errors.js'

export type TradeType = 'EXACT_INPUT' | 'EXPECTED_OUTPUT'

type SwapWidgetRendererProps = {
  transactionModalOpen: boolean
  depositAddressModalOpen: boolean
  children: (props: ChildrenProps) => ReactNode
  defaultFromToken?: Token
  defaultToToken?: Token
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
  price?: ReturnType<typeof usePrice>['data']
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
  maxCapacityWei?: string
  maxCapacityFormatted?: string
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
  invalidateBalanceQueries: () => void
  setUseExternalLiquidity: Dispatch<React.SetStateAction<boolean>>
  setDetails: Dispatch<React.SetStateAction<Execute['details'] | null>>
  setSwapError: Dispatch<React.SetStateAction<Error | null>>
}

const SwapWidgetRenderer: FC<SwapWidgetRendererProps> = ({
  transactionModalOpen,
  depositAddressModalOpen,
  defaultFromToken,
  defaultToToken,
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
  onAnalyticEvent
}) => {
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const connectorKeyOverrides = providerOptionsContext.vmConnectorKeyOverrides
  const relayClient = useRelayClient()
  const { connector } = useAccount()
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
  const [details, setDetails] = useState<null | Execute['details']>(null)

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
    defaultTradeType === 'EXPECTED_OUTPUT' ? defaultAmount ?? '' : '',
    500
  )

  const [swapError, setSwapError] = useState<Error | null>(null)
  const [fromToken, setFromToken] = useState<Token | undefined>(
    defaultFromToken
  )
  const [toToken, setToToken] = useState<Token | undefined>(defaultToToken)
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
      (linkedWallet) => address === linkedWallet.address
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

  const { displayName: toDisplayName } = useENSResolver(recipient, {
    enabled: toChain?.vmType === 'evm'
  })

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

  const externalLiquiditySupport = usePrice(
    relayClient ? relayClient : undefined,
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
    {
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

  const [currentSlippageTolerance, setCurrentSlippageTolerance] = useState<
    string | undefined
  >(slippageTolerance)

  useEffect(() => {
    setCurrentSlippageTolerance(slippageTolerance)
  }, [slippageTolerance])

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
          slippageTolerance: slippageTolerance
        }
      : undefined

  const onQuoteReceived: Parameters<typeof usePrice>['2'] = ({
    details,
    steps
  }) => {
    onAnalyticEvent?.(EventNames.SWAP_EXECUTE_QUOTE_RECEIVED, {
      wallet_connector: connector?.name,
      amount_in: details?.currencyIn?.amountFormatted,
      currency_in: details?.currencyIn?.currency?.symbol,
      chain_id_in: details?.currencyIn?.currency?.chainId,
      amount_out: details?.currencyOut?.amountFormatted,
      currency_out: details?.currencyOut?.currency?.symbol,
      chain_id_out: details?.currencyOut?.currency?.chainId,
      is_canonical: useExternalLiquidity,
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
      toToken !== undefined
  )

  const {
    data: _quoteData,
    error: quoteError,
    isLoading: isFetchingQuote
  } = useQuote(
    relayClient ? relayClient : undefined,
    wallet,
    quoteParameters,
    undefined,
    onQuoteReceived,
    {
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

  //Here we fetch the price data and quote data in parallel and then merge into one data model
  let error = _quoteData || isFetchingQuote ? null : quoteError
  let price = error ? undefined : _quoteData

  useDisconnected(address, () => {
    setCustomToAddress(undefined)
  })

  useEffect(() => {
    if (tradeType === 'EXACT_INPUT') {
      const amountOut = price?.details?.currencyOut?.amount ?? ''
      setAmountOutputValue(
        amountOut !== ''
          ? formatUnits(
              BigInt(amountOut),
              Number(price?.details?.currencyOut?.currency?.decimals ?? 18)
            )
          : ''
      )
    } else if (tradeType === 'EXPECTED_OUTPUT') {
      const amountIn = price?.details?.currencyIn?.amount ?? ''
      setAmountInputValue(
        amountIn !== ''
          ? formatUnits(
              BigInt(amountIn),
              Number(price?.details?.currencyIn?.currency?.decimals ?? 18)
            )
          : ''
      )
    }
    debouncedAmountInputControls.flush()
    debouncedAmountOutputControls.flush()
  }, [price, tradeType])

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
    return fromToken && toToken && fromChain && toChain && price
      ? parseFees(toChain, fromChain, price)
      : null
  }, [price, fromToken, toToken, relayClient])

  const totalAmount = BigInt(price?.details?.currencyIn?.amount ?? 0n)

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
  const isInsufficientLiquidityError = fetchQuoteErrorMessage?.includes(
    'No quotes available'
  )
  const isCapacityExceededError =
    fetchQuoteDataErrorMessage?.includes(
      'Amount is higher than the available liquidity'
    ) || fetchQuoteDataErrorMessage?.includes('Insufficient relayer liquidity')
  const isCouldNotExecuteError =
    fetchQuoteDataErrorMessage?.includes('Could not execute')
  const highRelayerServiceFee = isHighRelayerServiceFeeUsd(price)
  const relayerFeeProportion = calculateRelayerFeeProportionUsd(price)
  const timeEstimate = calculatePriceTimeEstimate(price?.details)
  const canonicalTimeEstimate = calculatePriceTimeEstimate(
    externalLiquiditySupport.data?.details
  )

  const isFromNative = fromToken?.address === fromChain?.currency?.address

  const isSameCurrencySameRecipientSwap =
    fromToken?.address === toToken?.address &&
    fromToken?.chainId === toToken?.chainId &&
    address === recipient
  const operation = price?.details?.operation || 'swap'
  const maxCapacity = isCapacityExceededError
    ? extractMaxCapacity(
        fetchQuoteDataErrorMessage ?? undefined,
        toToken?.decimals
      )
    : undefined
  const maxCapacityWei = maxCapacity?.value
  const maxCapacityFormatted = maxCapacity?.formatted

  let ctaCopy: string = 'Review'

  if (!fromToken || !toToken) {
    ctaCopy = 'Select a token'
  } else if (
    multiWalletSupportEnabled &&
    !isValidFromAddress &&
    fromChainWalletVMSupported
  ) {
    ctaCopy = `Select ${fromChain?.displayName} Wallet`
  } else if (multiWalletSupportEnabled && !isValidToAddress) {
    ctaCopy = toChainWalletVMSupported
      ? `Select ${toChain?.displayName} Wallet`
      : `Enter ${toChain?.displayName} Address`
  } else if (toChain?.vmType !== 'evm' && !isValidToAddress) {
    ctaCopy = `Enter ${toChain?.displayName} Address`
  } else if (isSameCurrencySameRecipientSwap) {
    ctaCopy = 'Invalid recipient'
  } else if (!debouncedInputAmountValue || !debouncedOutputAmountValue) {
    ctaCopy = 'Enter an amount'
  } else if (hasInsufficientBalance) {
    ctaCopy = 'Insufficient Balance'
  } else if (isInsufficientLiquidityError) {
    ctaCopy = 'Insufficient Liquidity'
  } else if (!toChainWalletVMSupported && !isValidToAddress) {
    ctaCopy = `Enter ${toChain.displayName} Address`
  } else if (transactionModalOpen) {
    ctaCopy = 'Review'
  }

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

  return (
    <>
      {children({
        price,
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
        maxCapacityFormatted,
        maxCapacityWei,
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
        invalidateBalanceQueries,
        setUseExternalLiquidity,
        setDetails,
        setSwapError
      })}
    </>
  )
}

export default SwapWidgetRenderer
