export class SolverStatusTimeoutError extends Error {
  txHash: `0x${string}`
  skipWaitingForTransaction?: boolean

  constructor(
    txHash: `0x${string}`,
    attemptCount: number,
    skipWaitingForTransaction: boolean
  ) {
    super(
      `Failed to receive a successful response for solver status check with hash '${txHash}' after ${attemptCount} attempt(s).`
    )
    this.name = 'SolverStatusTimeoutError'
    this.txHash = txHash
    this.skipWaitingForTransaction = skipWaitingForTransaction
  }
}
