export class DepositTransactionTimeoutError extends Error {
  txHash: `0x${string}`

  constructor(txHash: `0x${string}`, attemptCount: number) {
    super(
      `Deposit transaction with hash '${txHash}' is pending after ${attemptCount} attempt(s).`
    )
    this.name = 'DepositTransactionTimeoutError'
    this.txHash = txHash
  }
}
