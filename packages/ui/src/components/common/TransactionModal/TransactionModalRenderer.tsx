import {
  type FC,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
  type SetStateAction,
  type Dispatch
} from 'react'
import type { Address } from 'viem'
import type {
  Execute,
  ExecuteStep,
  ExecuteStepItem
} from '@reservoir0x/relay-sdk'
import {
  calculateExecutionTime,
  calculateFillTime,
  extractDepositRequestId
} from '../../../utils/relayTransaction.js'
import { useRequests } from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from '../../../hooks/index.js'

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
  transaction: ReturnType<typeof useRequests>['data']['0']
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
  error?: Error | null
  onSuccess?: () => void
  onValidating?: () => void
}

export const TransactionModalRenderer: FC<Props> = ({
  children,
  address,
  steps,
  error,
  onSuccess,
  onValidating
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
      onValidating?.()
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

  const client = useRelayClient()

  // Fetch Success Tx
  const { data: transactions } = useRequests(
    progressStep === TransactionProgressStep.Success && allTxHashes[0]
      ? {
          user: address,
          hash: allTxHashes[0]?.txHash
        }
      : undefined,
    client?.baseApiUrl,
    {
      enabled:
        progressStep === TransactionProgressStep.Success && allTxHashes[0]
          ? true
          : false
    }
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
