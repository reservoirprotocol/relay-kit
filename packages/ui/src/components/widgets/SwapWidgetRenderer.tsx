import type { ComponentPropsWithoutRef, Dispatch, FC, ReactNode } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  useCurrencyBalance,
  useENSResolver,
  useRelayClient,
  useDebounceState,
  useWalletAddress,
  useDisconnected
} from '../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits, isAddress, parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useCapabilities } from 'wagmi/experimental'
import type { BridgeFee, Token } from '../../types/index.js'
import { useQueryClient } from '@tanstack/react-query'
import { evmDeadAddress, solDeadAddress } from '../../constants/address.js'
import type { Execute } from '@reservoir0x/relay-sdk'
import {
  calculatePriceTimeEstimate,
  calculateRelayerFeeProportionUsd,
  isHighRelayerServiceFeeUsd,
  parseFees
} from '../../utils/quote.js'
import { usePrice } from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../constants/events.js'
import { ProviderOptionsContext } from '../../providers/RelayKitProvider.js'
import type { DebouncedState } from 'usehooks-ts'
import type Text from '../../components/primitives/Text.js'
import { findSupportedWallet, isSolanaAddress } from '../../utils/solana.js'
import type { AdaptedWallet } from '@reservoir0x/relay-sdk'
import type { LinkedWallet } from '../../types/index.js'
import { formatBN } from '../../utils/numbers.js'

export type TradeType = 'EXACT_INPUT' | 'EXACT_OUTPUT'

type SwapWidgetRendererProps = {
  transactionModalOpen: boolean
  children: (props: ChildrenProps) => ReactNode
  defaultFromToken?: Token
  defaultToToken?: Token
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: TradeType
  checkExternalLiquiditySupport?: boolean
  context: 'Swap' | 'Deposit' | 'Withdraw'
  wallet?: AdaptedWallet
  linkedWallets?: LinkedWallet[]
  multiWalletSupportEnabled?: boolean
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
  fromBalance?: bigint
  isFetchingPrice: boolean
  isLoadingToBalance: boolean
  isLoadingFromBalance: boolean
  highRelayerServiceFee: boolean
  relayerFeeProportion: bigint
  hasInsufficientBalance: boolean
  isInsufficientLiquidityError?: boolean
  isCapacityExceededError?: boolean
  maxCapacityWei?: string
  maxCapacityFormatted?: string
  ctaCopy: string
  isFromNative: boolean
  useExternalLiquidity: boolean
  supportsExternalLiquidity: boolean
  timeEstimate?: { time: number; formattedTime: string }
  fetchingExternalLiquiditySupport: boolean
  isSvmSwap: boolean
  isValidFromAddress: boolean
  isValidToAddress: boolean
  invalidateBalanceQueries: () => void
  setUseExternalLiquidity: Dispatch<React.SetStateAction<boolean>>
  setDetails: Dispatch<React.SetStateAction<Execute['details'] | null>>
  setSwapError: Dispatch<React.SetStateAction<Error | null>>
}

const SwapWidgetRenderer: FC<SwapWidgetRendererProps> = ({
  transactionModalOpen,
  defaultFromToken,
  defaultToToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  context,
  checkExternalLiquiditySupport,
  wallet,
  multiWalletSupportEnabled = false,
  linkedWallets,
  children,
  onAnalyticEvent
}) => {
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const relayClient = useRelayClient()
  const { connector } = useAccount()
  const [customToAddress, setCustomToAddress] = useState<
    Address | string | undefined
  >(defaultToAddress)
  const [useExternalLiquidity, setUseExternalLiquidity] =
    useState<boolean>(false)
  const address = useWalletAddress(wallet, linkedWallets)

  const [tradeType, setTradeType] = useState<'EXACT_INPUT' | 'EXACT_OUTPUT'>(
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
    defaultTradeType === 'EXACT_OUTPUT' ? defaultAmount ?? '' : '',
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

  const defaultRecipient = useMemo(() => {
    const isValidToAddress =
      toChain?.vmType === 'evm'
        ? isAddress(customToAddress ?? address ?? '')
        : isSolanaAddress(customToAddress ?? address ?? '')
    if (
      multiWalletSupportEnabled &&
      toChain &&
      linkedWallets &&
      !isValidToAddress
    ) {
      const supportedAddress = findSupportedWallet(
        toChain.vmType,
        customToAddress,
        linkedWallets
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

  const { displayName: toDisplayName } = useENSResolver(recipient)

  const {
    value: fromBalance,
    queryKey: fromBalanceQueryKey,
    isLoading: isLoadingFromBalance,
    isError: fromBalanceErrorFetching,
    isDuneBalance: fromBalanceIsDune
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
    isDuneBalance: toBalanceIsDune
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

  const isValidFromAddress =
    fromChain?.vmType === 'evm'
      ? isAddress(address ?? '')
      : isSolanaAddress(address ?? '')

  const fromAddressWithFallback =
    fromChain?.vmType === 'evm'
      ? address && isAddress(address)
        ? address
        : evmDeadAddress
      : address && isSolanaAddress(address)
        ? address
        : solDeadAddress

  const isValidToAddress =
    toChain?.vmType === 'evm'
      ? isAddress(recipient ?? '')
      : isSolanaAddress(recipient ?? '')

  const toAddressWithFallback =
    toChain?.vmType === 'evm'
      ? recipient && isAddress(recipient)
        ? recipient
        : evmDeadAddress
      : recipient && isSolanaAddress(recipient)
        ? recipient
        : solDeadAddress

  const externalLiquiditySupport = usePrice(
    relayClient ? relayClient : undefined,
    fromToken && toToken
      ? {
          user: fromChain?.vmType === 'evm' ? evmDeadAddress : solDeadAddress,
          originChainId: fromToken.chainId,
          destinationChainId: toToken.chainId,
          originCurrency: fromToken.address,
          destinationCurrency: toToken.address,
          recipient:
            fromChain?.vmType === 'evm' ? evmDeadAddress : solDeadAddress,
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
        checkExternalLiquiditySupport &&
        fromToken !== undefined &&
        toToken !== undefined
    }
  )
  const supportsExternalLiquidity =
    tokenPairIsCanonical && externalLiquiditySupport.status === 'success'
      ? true
      : false

  const {
    data: price,
    isLoading: isFetchingPrice,
    error
  } = usePrice(
    relayClient ? relayClient : undefined,
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
          useExternalLiquidity
        }
      : undefined,
    ({ details }) => {
      onAnalyticEvent?.(EventNames.SWAP_EXECUTE_QUOTE_RECEIVED, {
        wallet_connector: connector?.name,
        amount_in: details?.currencyIn?.amountFormatted,
        currency_in: details?.currencyIn?.currency?.symbol,
        chain_id_in: details?.currencyIn?.currency?.chainId,
        amount_out: details?.currencyOut?.amountFormatted,
        currency_out: details?.currencyOut?.currency?.symbol,
        chain_id_out: details?.currencyOut?.currency?.chainId,
        is_canonical: useExternalLiquidity
      })
    },
    {
      enabled: Boolean(
        relayClient &&
          ((tradeType === 'EXACT_INPUT' &&
            debouncedInputAmountValue &&
            debouncedInputAmountValue.length > 0 &&
            Number(debouncedInputAmountValue) !== 0) ||
            (tradeType === 'EXACT_OUTPUT' &&
              debouncedOutputAmountValue &&
              debouncedOutputAmountValue.length > 0 &&
              Number(debouncedOutputAmountValue) !== 0)) &&
          fromToken !== undefined &&
          toToken !== undefined
      ),
      refetchInterval:
        !transactionModalOpen &&
        debouncedInputAmountValue === amountInputValue &&
        debouncedOutputAmountValue === amountOutputValue
          ? 12000
          : undefined
    }
  )

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
    } else if (tradeType === 'EXACT_OUTPUT') {
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
      !hasAuxiliaryFundsSupport
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
  const isCapacityExceededError = fetchQuoteDataErrorMessage?.includes(
    'Amount is higher than the available liquidity'
  )
  const highRelayerServiceFee = isHighRelayerServiceFeeUsd(price)
  const relayerFeeProportion = calculateRelayerFeeProportionUsd(price)
  const timeEstimate = calculatePriceTimeEstimate(price?.details)

  const isFromNative = fromToken?.address === fromChain?.currency?.address

  const isSameCurrencySameRecipientSwap =
    fromToken?.address === toToken?.address &&
    fromToken?.chainId === toToken?.chainId &&
    address === recipient
  const operation = price?.details?.operation || 'swap'
  const maxCapacityWei =
    isCapacityExceededError && fetchQuoteDataErrorMessage
      ? fetchQuoteDataErrorMessage.match(/(\d+)/)?.[0]
      : undefined
  const maxCapacityFormatted = maxCapacityWei
    ? formatBN(BigInt(maxCapacityWei), 5, toToken?.decimals ?? 18)
    : undefined

  let ctaCopy: string = context || 'Swap'

  switch (operation) {
    case 'wrap': {
      ctaCopy = 'Wrap'
      break
    }
    case 'unwrap': {
      ctaCopy = 'Unwrap'
      break
    }
    case 'send': {
      ctaCopy = 'Send'
      break
    }
    case 'swap':
    default: {
      if (context === 'Swap') {
        ctaCopy = 'Trade'
      } else {
        ctaCopy = context === 'Deposit' ? 'Deposit' : 'Withdraw'
      }
      break
    }
  }

  if (!fromToken || !toToken) {
    ctaCopy = 'Select a token'
  } else if (multiWalletSupportEnabled && !isValidFromAddress) {
    ctaCopy = `Select ${fromChain?.displayName} Wallet`
  } else if (multiWalletSupportEnabled && !isValidToAddress) {
    ctaCopy = `Select ${toChain?.displayName} Wallet`
  } else if (toChain?.vmType === 'svm' && !isValidToAddress) {
    ctaCopy = `Enter ${toChain?.displayName} Address`
  } else if (isSameCurrencySameRecipientSwap) {
    ctaCopy = 'Invalid recipient'
  } else if (!debouncedInputAmountValue || !debouncedOutputAmountValue) {
    ctaCopy = 'Enter an amount'
  } else if (hasInsufficientBalance) {
    ctaCopy = 'Insufficient Balance'
  } else if (isInsufficientLiquidityError) {
    ctaCopy = 'Insufficient Liquidity'
  } else if (transactionModalOpen) {
    switch (operation) {
      case 'wrap': {
        ctaCopy = 'Wrapping'
        break
      }
      case 'unwrap': {
        ctaCopy = 'Unwrapping'
        break
      }
      case 'send': {
        ctaCopy = 'Sending'
        break
      }
      case 'swap':
      default: {
        if (context === 'Swap') {
          ctaCopy = 'Trade'
        } else {
          ctaCopy = context === 'Deposit' ? 'Depositing' : 'Withdrawing'
        }
        break
      }
    }
  }

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
        isLoadingToBalance,
        isFetchingPrice,
        isLoadingFromBalance,
        fromBalance,
        highRelayerServiceFee,
        relayerFeeProportion,
        hasInsufficientBalance,
        isInsufficientLiquidityError,
        isCapacityExceededError,
        maxCapacityFormatted,
        maxCapacityWei,
        ctaCopy,
        isFromNative,
        useExternalLiquidity,
        supportsExternalLiquidity,
        timeEstimate,
        fetchingExternalLiquiditySupport: externalLiquiditySupport.isFetching,
        isSvmSwap,
        isValidFromAddress,
        isValidToAddress,
        invalidateBalanceQueries,
        setUseExternalLiquidity,
        setDetails,
        setSwapError
      })}
    </>
  )
}

export default SwapWidgetRenderer
