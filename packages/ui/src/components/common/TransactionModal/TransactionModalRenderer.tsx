import {
  FC,
  useMemo,
  useState,
  useEffect,
  ReactNode,
  SetStateAction,
  Dispatch
} from 'react'
import { Address } from 'viem'
import { Execute, ExecuteStep, ExecuteStepItem } from '@reservoir0x/relay-sdk'
import {
  calculateExecutionTime,
  calculateFillTime,
  extractDepositRequestId
} from '../../../lib/utils/relayTransaction'
import { useUserTransactions } from '../../../hooks'
import { EventNames } from '../../../analytics/events'
import posthog from 'posthog-js'
import { extractQuoteId } from '../../../lib/utils/quote'

export enum TransactionProgressStep {
  WalletConfirmation,
  Validating,
  Success,
  Error
}

export type TxHashes = { txHash: Address; chainId: number }[]

export type ChildrenProps = {
  progressStep: TransactionProgressStep
  setProgressStep: Dispatch<SetStateAction<TransactionProgressStep>>
  currentStep?: ExecuteStep | null
  setCurrentStep: Dispatch<SetStateAction<ExecuteStep | undefined | null>>
  currentStepItem: ExecuteStepItem | null | undefined
  setCurrentStepItem: Dispatch<
    SetStateAction<ExecuteStepItem | null | undefined>
  >
  allTxHashes: TxHashes
  setAllTxHashes: Dispatch<SetStateAction<TxHashes>>
  transaction: ReturnType<typeof useUserTransactions>['data']['0']
  seconds: number
  fillTime: string
  executionTime?: string
  executionTimeSeconds?: number
  startTimestamp: number
  setStartTimestamp: Dispatch<SetStateAction<number>>
  requestId: string | null
}

type Props = {
  children: (props: ChildrenProps) => ReactNode
  address?: Address
  steps?: Execute['steps'] | null
  fees?: Execute['fees']
  error?: Error | null
  onSuccess?: () => void
}

export const TransactionModalRenderer: FC<Props> = ({
  children,
  address,
  steps,
  fees,
  error,
  onSuccess
}) => {
  const [progressStep, setProgressStep] = useState(
    TransactionProgressStep.WalletConfirmation
  )
  const [currentStep, setCurrentStep] = useState<
    null | NonNullable<Props['steps']>['0']
  >()
  const [currentStepItem, setCurrentStepItem] = useState<
    null | NonNullable<NonNullable<Props['steps']>['0']['items']>['0']
  >()
  const [allTxHashes, setAllTxHashes] = useState<TxHashes>([])
  const [startTimestamp, setStartTimestamp] = useState(0)

  useEffect(() => {
    if (error) {
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
      posthog.capture(EventNames.TRANSACTION_VALIDATING, {
        quote_id: extractQuoteId(steps)
      })
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
      onSuccess?.()
    }
  }, [steps, error])

  // Fetch Success Tx
  const { data: transactions } = useUserTransactions(
    progressStep === TransactionProgressStep.Success && allTxHashes[0]
      ? {
          user: address,
          hash: allTxHashes[0]?.txHash
        }
      : undefined,
    {}
  )
  const transaction = transactions[0]
  const { fillTime, seconds } = calculateFillTime(transaction)
  const { fillTime: executionTime, seconds: executionTimeSeconds } =
    calculateExecutionTime(Math.floor(startTimestamp / 1000), transaction)

  const requestId = useMemo(() => extractDepositRequestId(steps), [steps])

  return (
    <>
      {children({
        progressStep,
        setProgressStep,
        currentStep,
        setCurrentStep,
        currentStepItem,
        setCurrentStepItem,
        allTxHashes,
        setAllTxHashes,
        transaction,
        fillTime,
        seconds,
        executionTime,
        executionTimeSeconds,
        startTimestamp,
        setStartTimestamp,
        requestId
      })}
    </>
  )
}
