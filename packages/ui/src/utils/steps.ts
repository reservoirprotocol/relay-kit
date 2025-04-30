import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import type { Token } from '../types/index.js'

export type FormattedStep = {
  id: string
  action: string
  isActive: boolean
  isCompleted: boolean
  progressState?: NonNullable<
    Execute['steps']['0']['items']
  >[0]['progressState']
  txHashes?: { txHash: string; chainId: number }[]
  isWalletAction: boolean
  chainId?: number
  isApproveStep?: boolean
}

type FormatTransactionStepsProps = {
  steps: Execute['steps'] | null
  fromToken?: Token
  fromChain?: RelayChain
  toChain?: RelayChain
  operation: string
}

/**
 * formattedSteps transforms backend transaction steps into user-friendly UI steps by:
 * - Tracking active/delayed/completed states
 * - Adding readable action descriptions
 * - Extracting transaction hashes for explorer links
 * - Adding a final Relay processing step
 */
export const formatTransactionSteps = ({
  steps,
  fromToken,
  fromChain,
  toChain,
  operation
}: FormatTransactionStepsProps) => {
  if (!steps || steps.length === 0)
    return { formattedSteps: [], status: undefined }

  const result: FormattedStep[] = []
  const executableSteps = steps?.filter(
    (step) => step.items && step.items.length > 0
  )

  // Check if the last executable step has validating_delayed status
  const lastStep = executableSteps[executableSteps.length - 1]
  const lastStepItem = lastStep?.items?.[0]
  const status =
    lastStepItem?.progressState === 'validating_delayed' ? 'delayed' : undefined

  // Find the current active step
  let activeStepIndex = executableSteps.findIndex((step) =>
    step.items?.some((item) => item.status === 'incomplete')
  )

  // If no active step found (all complete or all incomplete), set to first step
  if (activeStepIndex === -1) {
    activeStepIndex = executableSteps.length > 0 ? 0 : -1
  }

  // Process each step
  executableSteps.forEach((step, index) => {
    const isLastExecutableStep = index === executableSteps.length - 1
    const firstItem = step.items?.[0]
    const progressState = firstItem?.progressState

    // Determine if this step is completed
    let isCompleted =
      step.items?.every((item) => item.status === 'complete') || false

    // For the last executable step, check progressState
    if (isLastExecutableStep && !isCompleted && progressState) {
      if (step.kind === 'transaction' && progressState !== 'confirming') {
        isCompleted = true
      } else if (step.kind === 'signature' && progressState !== 'signing') {
        isCompleted = true
      }
    }

    const isActive = index === activeStepIndex && !isCompleted

    const txHashes =
      step.items?.flatMap((item) => [
        ...(item.txHashes || []),
        ...(item.internalTxHashes || [])
      ]) || []

    const isApproveStep =
      step.id === 'approve' || (step.id as any) === 'approval'

    result.push({
      id: step.id,
      action: getStepActionText(step.id, operation),
      isActive,
      isCompleted,
      progressState,
      txHashes,
      isWalletAction: true,
      chainId: fromToken?.chainId,
      isApproveStep
    })
  })

  const allStepsComplete = result.every((step) => step.isCompleted)
  const isSameChain = fromChain?.id === toChain?.id

  // Add the appropriate final step
  if (isSameChain) {
    result.push({
      id: 'chain-confirm',
      action: `Relay processes your transaction on ${fromChain?.displayName}`,
      isActive: allStepsComplete,
      isCompleted: false,
      isWalletAction: false,
      chainId: fromChain?.id
    })
  } else {
    result.push({
      id: 'relay-fill',
      action: `Relay fills your order on ${toChain?.displayName}`,
      isActive: allStepsComplete,
      isCompleted: false,
      isWalletAction: false,
      chainId: toChain?.id
    })
  }

  return { formattedSteps: result, status }
}

/**
 * Returns the appropriate action text for a transaction step based on its ID
 * @param stepId The ID of the step
 * @param operation The operation being performed (swap, bridge, etc.)
 * @returns The formatted action text to display
 */
export function getStepActionText(stepId: string, operation: string): string {
  if (stepId === 'approve' || stepId === 'approval') {
    return 'Approve token'
  }
  if (
    stepId === 'authorize' ||
    stepId === 'authorize1' ||
    stepId === 'authorize2'
  ) {
    return 'Sign authorization'
  }

  if (stepId === 'swap' || stepId === 'deposit' || stepId === 'send') {
    return `Confirm ${operation}`
  }

  return 'Confirm transaction'
}
