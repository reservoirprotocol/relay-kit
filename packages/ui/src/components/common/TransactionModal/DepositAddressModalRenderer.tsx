import {
  type FC,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
  type SetStateAction,
  type Dispatch,
  useContext
} from 'react'
import { parseUnits, type Address } from 'viem'
import {
  type AdaptedWallet,
  type Execute,
  type RelayChain
} from '@reservoir0x/relay-sdk'
import {
  calculateFillTime,
  extractDepositRequestId
} from '../../../utils/relayTransaction.js'
import type { Token } from '../../../types/index.js'
import {
  useQuote,
  useRequests,
  useExecutionStatus
} from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from '../../../hooks/index.js'
import { EventNames } from '../../../constants/events.js'
import { ProviderOptionsContext } from '../../../providers/RelayKitProvider.js'
import { useAccount } from 'wagmi'
import { extractDepositAddress, extractQuoteId } from '../../../utils/quote.js'
import { getDeadAddress } from '@reservoir0x/relay-sdk'
import { useQueryClient } from '@tanstack/react-query'

export enum TransactionProgressStep {
  WaitingForDeposit,
  Validating,
  Success,
  Error
}

export type TxHashes = { txHash: string; chainId: number }[]

export type ChildrenProps = {
  progressStep: TransactionProgressStep
  setProgressStep: Dispatch<SetStateAction<TransactionProgressStep>>
  quote: ReturnType<typeof useQuote>['data']
  isFetchingQuote: boolean
  quoteError: Error | null
  swapError: Error | null
  setSwapError: Dispatch<SetStateAction<Error | null>>
  allTxHashes: TxHashes
  transaction?: ReturnType<typeof useRequests>['data']['0']
  seconds: number
  fillTime: string
  requestId: string | null
  depositAddress?: string
  executionStatus?: ReturnType<typeof useExecutionStatus>['data']
}

type Props = {
  open: boolean
  address?: string
  fromToken?: Token
  fromChain?: RelayChain
  toToken?: Token
  debouncedOutputAmountValue: string
  debouncedInputAmountValue: string
  amountInputValue: string
  amountOutputValue: string
  recipient?: string
  refundAddress?: string
  customToAddress?: Address
  wallet?: AdaptedWallet
  invalidateBalanceQueries: () => void
  children: (props: ChildrenProps) => ReactNode
  onSuccess?: (
    quote: ReturnType<typeof useQuote>['data'],
    executionStatus: ReturnType<typeof useExecutionStatus>['data']
  ) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapError?: (error: string, data?: Execute) => void
}

export const DepositAddressModalRenderer: FC<Props> = ({
  open,
  address,
  fromChain,
  fromToken,
  toToken,
  debouncedInputAmountValue,
  debouncedOutputAmountValue,
  recipient,
  customToAddress,
  refundAddress,
  invalidateBalanceQueries,
  children,
  onSuccess,
  onAnalyticEvent,
  onSwapError
}) => {
  const queryClient = useQueryClient()
  const [progressStep, setProgressStep] = useState(
    TransactionProgressStep.WaitingForDeposit
  )
  const [swapError, setSwapError] = useState<Error | null>(null)

  const relayClient = useRelayClient()
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const { connector } = useAccount()
  const deadAddress = getDeadAddress(fromChain?.vmType, fromChain?.id)

  const {
    data: quoteData,
    isLoading: isFetchingQuote,
    isRefetching,
    error: quoteError,
    queryKey
  } = useQuote(
    relayClient ? relayClient : undefined,
    undefined,
    fromToken && toToken
      ? {
          user: address ?? deadAddress,
          originChainId: fromToken.chainId,
          destinationChainId: toToken.chainId,
          originCurrency: fromToken.address,
          destinationCurrency: toToken.address,
          recipient: recipient as string,
          tradeType: 'EXACT_INPUT',
          appFees: providerOptionsContext.appFees,
          amount: parseUnits(
            debouncedInputAmountValue,
            fromToken.decimals
          ).toString(),
          referrer: relayClient?.source ?? undefined,
          useDepositAddress: true,
          // refundTo: refundAddress
          refundTo: '0x03508bB71268BBA25ECaCC8F620e01866650532c'
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
        chain_id_out: details?.currencyOut?.currency?.chainId,
        is_canonical: false,
        is_deposit_address: true
      })
    },
    {
      enabled: Boolean(
        open &&
          progressStep === TransactionProgressStep.WaitingForDeposit &&
          relayClient &&
          debouncedInputAmountValue &&
          debouncedInputAmountValue.length > 0 &&
          Number(debouncedInputAmountValue) !== 0 &&
          fromToken !== undefined &&
          toToken !== undefined
      ),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      refetchOnMount: false,
      retryOnMount: false,
      staleTime: Infinity
    }
  )

  const quote = isFetchingQuote || isRefetching ? undefined : quoteData

  const requestId = useMemo(
    () => extractDepositRequestId(quote?.steps as Execute['steps']),
    [quote]
  )

  const depositAddress = useMemo(
    () => extractDepositAddress(quote?.steps as Execute['steps']),
    [quote]
  )

  useEffect(() => {
    if (!open) {
      if (quote) {
        onAnalyticEvent?.(EventNames.DEPOSIT_ADDRESS_MODAL_CLOSED)
      }
      setSwapError(null)
      queryClient.invalidateQueries({ queryKey })
    } else {
      setProgressStep(TransactionProgressStep.WaitingForDeposit)
      onAnalyticEvent?.(EventNames.DEPOSIT_ADDRESS_MODAL_OPEN)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { data: executionStatus } = useExecutionStatus(
    relayClient ? relayClient : undefined,
    {
      requestId: requestId ?? undefined
    },
    undefined,
    undefined,
    {
      enabled: requestId !== null && open,
      refetchInterval(query) {
        const observableStates = ['waiting', 'pending', 'delayed']

        if (
          !query.state.data?.status ||
          (requestId && observableStates.includes(query.state.data?.status))
        ) {
          return 1000
        }
        return 0
      }
    }
  )

  useEffect(() => {
    if (
      executionStatus?.status === 'failure' ||
      executionStatus?.status === 'refund'
    ) {
      const swapError = new Error(
        executionStatus?.details ??
          'Oops! Something went wrong while processing your transaction.'
      )
      if (progressStep !== TransactionProgressStep.Error) {
        onSwapError?.(swapError.message, quote as Execute)
      }
      setProgressStep(TransactionProgressStep.Error)
      onAnalyticEvent?.(EventNames.DEPOSIT_ADDRESS_SWAP_ERROR, {
        error_message: executionStatus.details,
        wallet_connector: connector?.name,
        quote_id: requestId,
        amount_in: parseFloat(`${debouncedInputAmountValue}`),
        currency_in: fromToken?.symbol,
        chain_id_in: fromToken?.chainId,
        amount_out: parseFloat(`${debouncedOutputAmountValue}`),
        currency_out: toToken?.symbol,
        chain_id_out: toToken?.chainId,
        txHashes: executionStatus.txHashes ?? []
      })
      setSwapError(swapError)
      invalidateBalanceQueries()
    } else if (executionStatus?.status === 'success') {
      if (progressStep !== TransactionProgressStep.Success) {
        onSuccess?.(quote, executionStatus)
      }
      setProgressStep(TransactionProgressStep.Success)
      invalidateBalanceQueries()
    } else if (executionStatus?.status === 'pending') {
      setProgressStep(TransactionProgressStep.Validating)
    }
  }, [executionStatus?.status])

  const allTxHashes = useMemo(() => {
    const _allTxHashes: TxHashes = []
    executionStatus?.txHashes?.forEach((txHash) => {
      _allTxHashes.push({
        txHash,
        chainId: toToken?.chainId as number
      })
    })

    executionStatus?.inTxHashes?.forEach((txHash) => {
      _allTxHashes.push({
        txHash,
        chainId: fromToken?.chainId as number
      })
    })
    return _allTxHashes
  }, [executionStatus?.txHashes, executionStatus?.inTxHashes])

  const { data: transactions } = useRequests(
    (progressStep === TransactionProgressStep.Success ||
      progressStep === TransactionProgressStep.Error) &&
      allTxHashes[0]
      ? {
          user: address,
          hash: allTxHashes[0]?.txHash
        }
      : undefined,
    relayClient?.baseApiUrl,
    {
      enabled:
        (progressStep === TransactionProgressStep.Success ||
          progressStep === TransactionProgressStep.Error) &&
        allTxHashes[0]
          ? true
          : false
    }
  )

  const transaction = transactions[0]

  const { fillTime, seconds } = calculateFillTime(transaction)

  return (
    <>
      {children({
        progressStep,
        setProgressStep,
        quote,
        isFetchingQuote: isFetchingQuote || isRefetching,
        quoteError,
        swapError,
        setSwapError,
        allTxHashes,
        transaction: undefined,
        fillTime,
        seconds,
        requestId,
        depositAddress,
        executionStatus
      })}
    </>
  )
}
