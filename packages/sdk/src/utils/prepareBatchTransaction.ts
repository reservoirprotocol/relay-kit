import type { Execute } from '../types/Execute.js'

export function canBatchTransactions(steps: Execute['steps']) {
  const firstStep = steps[0]
  const secondStep = steps[1]

  const hasIncompleteApproval = firstStep?.items?.some(
    (item) => item.status === 'incomplete'
  )
  const hasIncompleteDeposit = secondStep?.items?.some(
    (item) => item.status === 'incomplete'
  )

  return (
    firstStep?.id === 'approve' &&
    (secondStep?.id === 'deposit' || secondStep?.id === 'swap') &&
    hasIncompleteApproval &&
    hasIncompleteDeposit
  )
}

export function prepareBatchTransaction(steps: Execute['steps']) {
  const secondStepId = steps[1]?.id // deposit or swap

  const batchedStep = {
    id: `approve-and-${secondStepId}` as any,
    action: 'Confirm transaction in your wallet',
    description: `Batching approval and ${secondStepId} transactions`,
    kind: 'transaction' as const,
    items: [
      ...(steps[0].items || []),
      ...(steps[1].items || []).map((item) => {
        // mark the second step as complete
        item.status = 'complete'
        item.progressState = 'complete'
        return item
      })
    ],
    requestId: steps[1].requestId ?? steps[0].requestId
  }

  return batchedStep
}
