import {
  type FC,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
  type SetStateAction,
  type Dispatch
} from 'react'
import { type Address } from 'viem'
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
import { parseFees } from '../../../utils/quote.js'

export enum TransactionProgressStep {
  // ReviewQuote,
  WalletConfirmation,
  // Validating,
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
  swap: () => void
  swapError: Error | null
  setSwapError: Dispatch<SetStateAction<Error | null>>
  steps: Execute['steps'] | null
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
  slippageTolerance?: string
  wallet?: AdaptedWallet
  // New
  swap: () => void
  steps: Execute['steps'] | null
  quote: ReturnType<typeof useQuote>['data']

  invalidateBalanceQueries: () => void
  children: (props: ChildrenProps) => ReactNode
  onSuccess?: (
    quote: ReturnType<typeof useQuote>['data'],
    steps: Execute['steps']
  ) => void
  onValidating?: (quote: Execute) => void
}

export const TransactionModalRenderer: FC<Props> = ({
  open,
  address,
  fromChain,
  fromToken,
  toToken,
  slippageTolerance,
  wallet,
  // New
  swap,
  steps,
  quote,
  children,
  onSuccess,
  onValidating
}) => {
  const relayClient = useRelayClient()

  const [progressStep, setProgressStep] = useState(
    TransactionProgressStep.WalletConfirmation
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

  useEffect(() => {
    if (swapError) {
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
      // setProgressStep(TransactionProgressStep.Validating)
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
  }, [steps, swapError])

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
        swap,
        steps,
        // setSteps,
        waitingForSteps,
        // quoteError,
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
        // quoteUpdatedAt,
        requestId,
        feeBreakdown,
        isLoadingTransaction,
        isAutoSlippage
      })}
    </>
  )
}
