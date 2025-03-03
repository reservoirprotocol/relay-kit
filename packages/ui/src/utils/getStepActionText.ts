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
