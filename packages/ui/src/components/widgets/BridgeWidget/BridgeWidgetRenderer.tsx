import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import type {
  ComponentPropsWithoutRef,
  Dispatch,
  FC,
  ReactNode,
  ReactPropTypes
} from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { parseUnits, zeroAddress, type Address } from 'viem'
import { ProviderOptionsContext } from '../../../providers/RelayKitProvider.js'
import {
  useCurrencyBalance,
  useENSResolver,
  useRelayClient,
  useDebounceState,
  useCurrencyConversion
} from '../../../hooks/index.js'
import { useAccount } from 'wagmi'
import {
  usePrice,
  useRelayConfig,
  type ConfigQuery
} from '@reservoir0x/relay-kit-hooks'
import { CurrenciesMap, type Currency } from '../../../constants/currencies.js'
import { deadAddress } from '../../../constants/address.js'
import { EventNames } from '../../../constants/events.js'
import {
  calculateAvailableAmount,
  calculatePriceTimeEstimate,
  calculateRelayerFeeProportion,
  calculateTimeEstimate,
  calculateTotalAmount,
  calculateTransactionFee,
  isHighRelayerServiceFee,
  parseFees
} from '../../../utils/quote.js'
import { useQueryClient } from '@tanstack/react-query'
import { useCapabilities } from 'wagmi/experimental'

type BridgeWidgetRendererProps = {
  children: (props: ChildrenProps) => ReactNode
  transactionModalOpen: boolean
  defaultFromChain: RelayChain
  defaultToChain: RelayChain
  defaultToAddress?: Address
  defaultAmount?: string
  defaultCurrency?: ConfigQuery['currency']
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onBridgeError?: (error: string, data?: Execute) => void
}

export type ChildrenProps = {
  fromChain: RelayChain
  toChain: RelayChain
  setFromChain: Dispatch<React.SetStateAction<RelayChain>>
  setToChain: Dispatch<React.SetStateAction<RelayChain>>
  price?: ReturnType<typeof usePrice>['data']
  isFetchingPrice: boolean
  error: Error | null
  amountValue: string
  debouncedAmountValue: string
  setAmountValue: (value: string) => void
  currency: Currency
  setCurrency: Dispatch<React.SetStateAction<Currency>>
  depositableChains: RelayChain[]
  withdrawableChains: RelayChain[]
  bridgeType: 'relay' | 'canonical'
  setBridgeType: Dispatch<React.SetStateAction<'relay' | 'canonical'>>
  useExternalLiquidity: boolean
  setUseExternalLiquidity: Dispatch<React.SetStateAction<boolean>>
  usePermit: boolean
  fromBalance: bigint | undefined
  fromBalanceIsLoading: boolean
  toBalance: bigint | undefined
  toBalanceIsLoading: boolean
  addressModalOpen: boolean
  setAddressModalOpen: Dispatch<React.SetStateAction<boolean>>
  address?: `0x${string}`
  customToAddress?: `0x${string}`
  recipient?: `0x${string}`
  toDisplayName?: string
  setCustomToAddress: Dispatch<React.SetStateAction<`0x${string}` | undefined>>
  hiddenCurrencies: string[]
  hasInsufficientBalance: boolean
  usdPrice: number
  isAboveCapacity: boolean
  availableAmount: bigint | null
  maxAmount: bigint | null
  canonicalBridgeSupported?: boolean
  feesOpen: boolean
  setFeesOpen: Dispatch<React.SetStateAction<boolean>>
  isReward: boolean
  timeEstimate?: { time: number; formattedTime: string }
  transactionFee: ReturnType<typeof calculateTransactionFee>
  feeBreakdown: ReturnType<typeof parseFees>
  ctaCopy: string
}

const BridgeWidgetRenderer: FC<BridgeWidgetRendererProps> = ({
  children,
  transactionModalOpen,
  defaultFromChain,
  defaultToChain,
  defaultToAddress,
  defaultAmount,
  defaultCurrency,
  onConnectWallet,
  onAnalyticEvent,
  onBridgeError
}) => {
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const relayClient = useRelayClient()
  const { address, connector } = useAccount()
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [customToAddress, setCustomToAddress] = useState<Address | undefined>(
    defaultToAddress
  )
  const [feesOpen, setFeesOpen] = useState(false)
  const [useExternalLiquidity, setUseExternalLiquidity] =
    useState<boolean>(false)
  const recipient = customToAddress ?? address
  const { displayName: toDisplayName } = useENSResolver(recipient)

  const [fromChain, setFromChain] = useState(defaultFromChain)
  const [toChain, setToChain] = useState(defaultToChain)

  const {
    value: amountValue,
    debouncedValue: debouncedAmountValue,
    setValue: setAmountValue
  } = useDebounceState<string>(defaultAmount ?? '', 500)
  const [currency, setCurrency] = useState<Currency>(
    defaultCurrency && defaultCurrency in CurrenciesMap
      ? CurrenciesMap[defaultCurrency as keyof typeof CurrenciesMap]
      : CurrenciesMap['eth']
  )
  const isErc20Currency = currency.id !== 'eth'
  const [bridgeType, setBridgeType] = useState<'relay' | 'canonical'>('relay')

  const fromChainErc20Currency = isErc20Currency
    ? fromChain?.erc20Currencies?.find((c) => c.id === currency.id)
    : undefined

  const toChainErc20Currency = isErc20Currency
    ? toChain?.erc20Currencies?.find((c) => c.id === currency.id)
    : undefined

  const fromChainCurrencyAddress = isErc20Currency
    ? fromChainErc20Currency?.address
    : zeroAddress
  const toChainCurrencyAddress = isErc20Currency
    ? toChainErc20Currency?.address
    : zeroAddress

  const { data: solverData } = useRelayConfig(
    relayClient ? relayClient : undefined,
    {
      originChainId: fromChain.id.toString(),
      destinationChainId: toChain.id.toString(),
      currency: currency.id as keyof typeof CurrenciesMap
    },
    {
      refetchInterval: 30000
    }
  )

  const depositableChains = useMemo(() => {
    return (relayClient?.chains ?? []).filter((chain) => chain.depositEnabled)
  }, [relayClient?.chains])

  const withdrawableChains = useMemo(() => {
    return (relayClient?.chains ?? []).filter((chain) =>
      !fromChain.depositEnabled ? chain.id !== fromChain.id : true
    )
  }, [relayClient?.chains, fromChain.depositEnabled, toChain.id])

  const hiddenCurrencies = relayClient?.chains.find(
    (chain) => chain.id === 666666666
  )
    ? []
    : ['degen']

  const {
    value: fromEthBalance,
    queryKey: fromEthBalanceQueryKey,
    isError: isFromEthBalanceError,
    error: fromEthBalanceError
  } = useCurrencyBalance({
    chainId: fromChain.id,
    address: address,
    currency: zeroAddress,
    enabled: isErc20Currency
  })

  const usePermit = Boolean(
    isErc20Currency &&
      fromChainErc20Currency?.supportsPermit &&
      toChainErc20Currency?.supportsPermit &&
      fromEthBalance &&
      fromEthBalance < 10000000000000000
  ) // 0.01 ETH

  const {
    data: price,
    isLoading: isFetchingPrice,
    error
  } = usePrice(
    relayClient ? relayClient : undefined,

    {
      user: address ?? deadAddress,
      originChainId: fromChain.id,
      destinationChainId: toChain.id,
      originCurrency: fromChainCurrencyAddress ?? zeroAddress,
      destinationCurrency: toChainCurrencyAddress ?? zeroAddress,
      recipient: recipient as string,
      tradeType: 'EXACT_OUTPUT',
      appFees: providerOptionsContext.appFees,
      amount: parseUnits(debouncedAmountValue, currency.decimals).toString(),
      usePermit: usePermit,
      useExternalLiquidity: bridgeType === 'canonical',
      referrer: relayClient?.source ?? undefined
    },
    ({ details }) => {
      onAnalyticEvent?.(EventNames.SWAP_EXECUTE_QUOTE_RECEIVED, {
        wallet_connector: connector?.name,
        amount_in: details?.currencyIn?.amountFormatted,
        currency_in: details?.currencyIn?.currency?.symbol,
        chain_id_in: details?.currencyIn?.currency?.chainId,
        amount_out: details?.currencyOut?.amountFormatted,
        currency_out: details?.currencyOut?.currency?.symbol,
        chain_id_out: details?.currencyOut?.currency?.chainId
      })
    },
    {
      enabled: Boolean(
        relayClient &&
          debouncedAmountValue &&
          debouncedAmountValue.length > 0 &&
          Number(debouncedAmountValue) !== 0
      ),
      refetchInterval: transactionModalOpen ? undefined : 12000
    }
  )

  const timeEstimate = calculatePriceTimeEstimate(price?.details)

  const conversionRates = useCurrencyConversion(
    debouncedAmountValue &&
      debouncedAmountValue.length > 0 &&
      Number(debouncedAmountValue) !== 0
      ? true
      : false
  )
  const usdConversion = conversionRates.data
    ? conversionRates.data[currency.symbol]
    : 0

  const gasConversion = conversionRates.data
    ? conversionRates.data[`${fromChain?.currency?.symbol ?? 'ETH'}`]
    : 0

  const usdPrice =
    Number(amountValue === '' ? '0' : amountValue) * usdConversion

  const transactionFee = useMemo(
    () =>
      calculateTransactionFee(
        price?.fees,
        currency,
        usePermit,
        gasConversion,
        usdConversion,
        usdPrice
      ),
    [price, currency, usePermit, gasConversion, usdConversion, usdPrice]
  )

  const isReward = transactionFee.totalUsd < 0

  const capacity = solverData?.solver
  const canonicalBridgeSupported =
    solverData?.supportsExternalLiquidity && currency.id == 'eth'
  const feeBreakdown = useMemo(
    () => parseFees(toChain, fromChain, price),
    [price, toChain, fromChain]
  )

  const totalAmount = useMemo(
    () =>
      calculateTotalAmount(
        debouncedAmountValue,
        currency,
        usdConversion,
        transactionFee
      ),
    [debouncedAmountValue, transactionFee, usdConversion, currency]
  )

  const queryClient = useQueryClient()

  const {
    value: fromBalance,
    queryKey: fromBalanceQueryKey,
    isLoading: fromBalanceIsLoading,
    error: fromBalanceError,
    isError: hasFromBalanceError
  } = useCurrencyBalance({
    chainId: fromChain.id,
    address: address,
    currency: fromChainCurrencyAddress as Address
  })

  const {
    value: toBalance,
    queryKey: toBalanceQueryKey,
    isLoading: toBalanceIsLoading
  } = useCurrencyBalance({
    chainId: toChain.id,
    address: recipient,
    currency: toChainCurrencyAddress as Address
  })

  const invalidateBalanceQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: fromBalanceQueryKey })
    queryClient.invalidateQueries({ queryKey: toBalanceQueryKey })
    if (isErc20Currency) {
      queryClient.invalidateQueries({ queryKey: fromEthBalanceQueryKey })
    }
  }, [
    queryClient,
    fromBalanceQueryKey,
    toBalanceQueryKey,
    fromEthBalanceQueryKey,
    isErc20Currency
  ])

  const { data: capabilities } = useCapabilities({
    query: {
      enabled:
        connector &&
        (connector.id === 'coinbaseWalletSDK' || connector.id === 'coinbase')
    }
  })
  const hasAuxiliaryFundsSupport = Boolean(
    capabilities?.[fromChain.id]?.auxiliaryFunds?.supported
  )

  const capacityPerRequest =
    bridgeType === 'canonical'
      ? '10000000000000000000000000000000'
      : capacity?.capacityPerRequest

  const maxAmount =
    fromBalance && capacityPerRequest
      ? fromBalance > BigInt(capacityPerRequest)
        ? BigInt(capacityPerRequest)
        : fromBalance
      : null

  const { data: maxQuote } = usePrice(
    relayClient ? relayClient : undefined,
    {
      user: address ? address : deadAddress,
      originChainId: fromChain.id,
      originCurrency: fromChainCurrencyAddress ?? zeroAddress,
      destinationChainId: toChain.id,
      destinationCurrency: toChainCurrencyAddress ?? zeroAddress,
      amount: `${maxAmount}`,
      tradeType: 'EXACT_OUTPUT',
      usePermit: usePermit,
      useExternalLiquidity: bridgeType === 'canonical',
      referrer: relayClient?.source ?? undefined
    },
    undefined,
    {
      enabled: Boolean(relayClient && maxAmount)
    }
  )

  const availableAmount = calculateAvailableAmount(
    currency,
    usePermit,
    maxQuote,
    maxAmount
  )

  const relayerFeeProportion = useMemo(
    () =>
      totalAmount && feeBreakdown
        ? calculateRelayerFeeProportion(totalAmount, feeBreakdown.breakdown)
        : 0,
    [feeBreakdown, totalAmount]
  )

  const highRelayerServiceFee = useMemo(
    () =>
      debouncedAmountValue && currency && price
        ? isHighRelayerServiceFee(debouncedAmountValue, currency, price)
        : false,
    [debouncedAmountValue, currency, price]
  )

  // Exclude the origin gas fee for erc20s
  const totalAmountRaw = isErc20Currency
    ? totalAmount.rawExcludingOriginGas
    : totalAmount.raw

  const isAboveCapacity = capacityPerRequest
    ? totalAmountRaw > BigInt(capacityPerRequest)
    : true

  const hasInsufficientGas =
    fromEthBalance &&
    !fromEthBalanceError &&
    fromEthBalance < transactionFee.gasFee

  const hasInsufficientBalance = Boolean(
    address &&
      !fromBalanceError &&
      (fromBalance ?? 0n) < totalAmountRaw &&
      !hasAuxiliaryFundsSupport
  )

  const hasInsufficientSafeBalance = Boolean(
    debouncedAmountValue &&
      availableAmount &&
      parseUnits(debouncedAmountValue, currency.decimals) > availableAmount &&
      !hasAuxiliaryFundsSupport
  )

  let ctaCopy = 'Bridge'
  if (!debouncedAmountValue) {
    ctaCopy = 'Enter an amount'
  } else if (hasInsufficientBalance) {
    ctaCopy = 'Insufficient Balance'
  } else if (hasInsufficientGas) {
    ctaCopy = `Insufficient ${currency?.symbol} Balance`
  } else if (isAboveCapacity) {
    ctaCopy = 'Exceeded Available Amount'
  } else {
    ctaCopy = 'Bridging'
  }

  return (
    <>
      {children({
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
        timeEstimate,
        isReward,
        transactionFee,
        feeBreakdown,
        ctaCopy
      })}
    </>
  )
}

export default BridgeWidgetRenderer
