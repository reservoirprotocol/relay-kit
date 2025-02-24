import {
  type FC,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
  type SetStateAction,
  type Dispatch,
  useContext,
  useCallback
} from 'react'
import { parseUnits, type Address, type WalletClient } from 'viem'
import {
  type AdaptedWallet,
  type Execute,
  type ExecuteStep,
  type ExecuteStepItem,
  type RelayChain
} from '@reservoir0x/relay-sdk'
import {
  calculateExecutionTime,
  calculateFillTime,
  extractDepositRequestId
} from '../../../utils/relayTransaction.js'
import type { BridgeFee, Token } from '../../../types/index.js'
import { useQuote, useRequests } from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from '../../../hooks/index.js'
import type { TradeType } from '../../../components/widgets/SwapWidgetRenderer.js'
import { EventNames } from '../../../constants/events.js'
import { ProviderOptionsContext } from '../../../providers/RelayKitProvider.js'
import { useAccount, useWalletClient } from 'wagmi'
import { extractQuoteId, parseFees } from '../../../utils/quote.js'
import { adaptViemWallet, getDeadAddress } from '@reservoir0x/relay-sdk'
import { errorToJSON } from '../../../utils/errors.js'

export enum TransactionProgressStep {
  ReviewQuote,
  WalletConfirmation,
  Validating,
  Success,
  Error
}

export type TxHashes = {
  txHash: string
  chainId: number
  isBatchTx?: boolean
}[]

export type ChildrenProps = {
  wallet?: AdaptedWallet
  progressStep: TransactionProgressStep
  setProgressStep: Dispatch<SetStateAction<TransactionProgressStep>>
  currentStep?: ExecuteStep | null
  setCurrentStep: Dispatch<SetStateAction<ExecuteStep | undefined | null>>
  currentStepItem: ExecuteStepItem | null | undefined
  setCurrentStepItem: Dispatch<
    SetStateAction<ExecuteStepItem | null | undefined>
  >
  quote: ReturnType<typeof useQuote>['data']
  isFetchingQuote: boolean
  isRefetchingQuote: boolean
  swap: () => void
  quoteError: Error | null
  swapError: Error | null
  setSwapError: Dispatch<SetStateAction<Error | null>>
  steps: Execute['steps'] | null
  setSteps: Dispatch<SetStateAction<Execute['steps'] | null>>
  waitingForSteps: boolean
  allTxHashes: TxHashes
  setAllTxHashes: Dispatch<SetStateAction<TxHashes>>
  transaction: ReturnType<typeof useRequests>['data']['0']
  seconds: number
  fillTime: string
  executionTime?: string
  executionTimeSeconds?: number
  startTimestamp: number
  setStartTimestamp: Dispatch<SetStateAction<number>>
  requestId: string | null
  quoteUpdatedAt: number
  feeBreakdown: {
    breakdown: BridgeFee[]
    totalFees: {
      usd?: string
      priceImpactPercentage?: string
      priceImpact?: string
      swapImpact?: string
    }
  } | null
  isLoadingTransaction: boolean
  isAutoSlippage: boolean
}

type Props = {
  open: boolean
  address?: Address | string
  fromToken?: Token
  fromChain?: RelayChain
  toToken?: Token
  debouncedOutputAmountValue: string
  debouncedInputAmountValue: string
  amountInputValue: string
  amountOutputValue: string
  recipient?: Address | string
  customToAddress?: Address
  tradeType: TradeType
  useExternalLiquidity: boolean
  slippageTolerance?: string
  wallet?: AdaptedWallet
  invalidateBalanceQueries: () => void
  children: (props: ChildrenProps) => ReactNode
  onSuccess?: (
    quote: ReturnType<typeof useQuote>['data'],
    steps: Execute['steps']
  ) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapError?: (error: string, data?: Execute) => void
  onValidating?: (quote: Execute) => void
}

export const TransactionModalRenderer: FC<Props> = ({
  open,
  address,
  fromChain,
  fromToken,
  toToken,
  debouncedInputAmountValue,
  debouncedOutputAmountValue,
  amountInputValue,
  amountOutputValue,
  recipient,
  customToAddress,
  tradeType,
  useExternalLiquidity,
  slippageTolerance,
  wallet,
  invalidateBalanceQueries,
  children,
  onSuccess,
  onAnalyticEvent,
  onSwapError,
  onValidating
}) => {
  const [steps, setSteps] = useState<null | Execute['steps']>(null)

  const [progressStep, setProgressStep] = useState(
    TransactionProgressStep.ReviewQuote
  )
  const [currentStep, setCurrentStep] = useState<
    null | NonNullable<Execute['steps']>['0']
  >()
  const [currentStepItem, setCurrentStepItem] = useState<
    null | NonNullable<NonNullable<Execute['steps']>['0']['items']>['0']
  >()
  const [allTxHashes, setAllTxHashes] = useState<TxHashes>([])
  const [startTimestamp, setStartTimestamp] = useState(0)
  const [waitingForSteps, setWaitingForSteps] = useState(false)

  const [swapError, setSwapError] = useState<Error | null>(null)

  const relayClient = useRelayClient()
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const walletClient = useWalletClient()
  const { connector } = useAccount()
  const deadAddress = getDeadAddress(fromChain?.vmType, fromChain?.id)
  const _quoteData =
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
          referrer: relayClient?.source ?? undefined,
          slippageTolerance: slippageTolerance,
          useExternalLiquidity
        }
      : undefined
  const {
    data: quote,
    isLoading: isFetchingQuote,
    isRefetching: isRefetchingQuote,
    executeQuote: executeSwap,
    error: quoteError,
    dataUpdatedAt: quoteUpdatedAt
  } = useQuote(
    relayClient ? relayClient : undefined,
    wallet ?? walletClient.data,
    _quoteData,
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
        is_canonical: useExternalLiquidity,
        slippage_tolerance_destination_percentage:
          details?.slippageTolerance?.destination?.percent,
        slippage_tolerance_origin_percentage:
          details?.slippageTolerance?.origin?.percent,
        steps
      })
    },
    {
      staleTime: 10000,
      enabled: Boolean(
        open &&
          progressStep === TransactionProgressStep.ReviewQuote &&
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
      ),
      refetchInterval:
        open &&
        progressStep === TransactionProgressStep.ReviewQuote &&
        debouncedInputAmountValue === amountInputValue &&
        debouncedOutputAmountValue === amountOutputValue
          ? 30000
          : undefined
    },
    (e: any) => {
      const errorMessage = errorToJSON(
        e?.response?.data?.message ? new Error(e?.response?.data?.message) : e
      )
      onAnalyticEvent?.(EventNames.QUOTE_ERROR, {
        wallet_connector: connector?.name,
        error_message: errorMessage,
        parameters: _quoteData
      })
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
          (typeof error.message === 'string' &&
            error.message.includes('Approval Denied')) ||
          (typeof error.message === 'string' &&
            error.message.includes('Plugin Closed')))
      ) {
        onAnalyticEvent?.(EventNames.USER_REJECTED_WALLET)
        setProgressStep(TransactionProgressStep.ReviewQuote)
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
      onAnalyticEvent?.(EventNames.SWAP_CTA_CLICKED)
      setWaitingForSteps(true)

      if (!executeSwap) {
        throw 'Missing a quote'
      }

      if (!wallet && !walletClient.data) {
        throw 'Missing a wallet'
      }

      const _wallet =
        wallet ?? adaptViemWallet(walletClient.data as WalletClient)

      const activeWalletChainId = await _wallet?.getChainId()
      if (fromToken && fromToken?.chainId !== activeWalletChainId) {
        onAnalyticEvent?.(EventNames.SWAP_SWITCH_NETWORK, {
          activeWalletChainId,
          chainId: fromToken.chainId
        })
        await _wallet?.switchChain(fromToken.chainId)
      }

      setProgressStep(TransactionProgressStep.WalletConfirmation)

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

  useEffect(() => {
    if (swapError || (quoteError && !isRefetchingQuote)) {
      setProgressStep(TransactionProgressStep.Error)
      return
    }
    if (!steps) {
      return
    }

    const executableSteps = steps.filter(
      (step) => step.items && step.items.length > 0
    )

    let stepCount = executableSteps.length
    let txHashes: TxHashes = []
    let currentStep: NonNullable<Execute['steps']>['0'] | null = null
    let currentStepItem:
      | NonNullable<Execute['steps'][0]['items']>[0]
      | undefined

    for (const step of executableSteps) {
      for (const item of step.items || []) {
        if (item.txHashes && item.txHashes.length > 0) {
          txHashes = item.txHashes.concat([...txHashes])
        }
        if (item.internalTxHashes && item.internalTxHashes.length > 0) {
          txHashes = item.internalTxHashes.concat([...txHashes])
        }
        if (item.status === 'incomplete') {
          currentStep = step
          currentStepItem = item

          break // Exit the inner loop once the first incomplete item is found
        }
      }
      if (currentStep && currentStepItem) break // Exit the outer loop if the current step and item have been found
    }

    setAllTxHashes(txHashes)

    if (
      (txHashes.length > 0 || currentStepItem?.isValidatingSignature == true) &&
      progressStep === TransactionProgressStep.WalletConfirmation
    ) {
      onValidating?.(quote as Execute)
      setProgressStep(TransactionProgressStep.Validating)
      setStartTimestamp(new Date().getTime())
    }

    if (!currentStep) {
      currentStep = executableSteps[stepCount - 1]
    }

    setCurrentStep(currentStep)
    setCurrentStepItem(currentStepItem)
    if (
      steps.every(
        (step) =>
          !step.items ||
          step.items.length == 0 ||
          step.items?.every((item) => item.status === 'complete')
      ) &&
      progressStep !== TransactionProgressStep.Success
    ) {
      setProgressStep(TransactionProgressStep.Success)
      onSuccess?.(quote, steps)
    }
  }, [steps, quoteError, swapError])

  const requestId = useMemo(() => extractDepositRequestId(steps), [steps])

  // Fetch Success Tx
  const { data: transactions, isLoading: isLoadingTransaction } = useRequests(
    (progressStep === TransactionProgressStep.Success ||
      progressStep === TransactionProgressStep.Error) &&
      (requestId || allTxHashes[0])
      ? requestId
        ? { id: requestId }
        : { hash: allTxHashes[0]?.txHash, user: address }
      : undefined,
    relayClient?.baseApiUrl,
    {
      enabled:
        (progressStep === TransactionProgressStep.Success ||
          progressStep === TransactionProgressStep.Error) &&
        (requestId || allTxHashes[0])
          ? true
          : false
    }
  )
  const transaction = transactions[0]
  const { fillTime, seconds } = calculateFillTime(transaction)
  const { fillTime: executionTime, seconds: executionTimeSeconds } =
    calculateExecutionTime(Math.floor(startTimestamp / 1000), transaction)

  const feeBreakdown = useMemo(() => {
    const chains = relayClient?.chains
    const fromChain = chains?.find((chain) => chain.id === fromToken?.chainId)
    const toChain = chains?.find((chain) => chain.id === toToken?.chainId)
    return fromToken && toToken && fromChain && toChain && quote
      ? parseFees(toChain, fromChain, quote)
      : null
  }, [quote, fromToken, toToken, relayClient])

  const isAutoSlippage = slippageTolerance === undefined

  return (
    <>
      {children({
        wallet,
        progressStep,
        setProgressStep,
        currentStep,
        setCurrentStep,
        currentStepItem,
        setCurrentStepItem,
        quote,
        isFetchingQuote,
        isRefetchingQuote,
        swap,
        steps,
        setSteps,
        waitingForSteps,
        quoteError,
        swapError,
        setSwapError,
        allTxHashes,
        setAllTxHashes,
        transaction,
        fillTime,
        seconds,
        executionTime,
        executionTimeSeconds,
        startTimestamp,
        setStartTimestamp,
        quoteUpdatedAt,
        requestId,
        feeBreakdown,
        isLoadingTransaction,
        isAutoSlippage
      })}
    </>
  )
}
