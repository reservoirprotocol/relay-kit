import type { TransactionReceipt } from 'viem'
import type { SvmReceipt } from '../types/index.js'

export class TransactionConfirmationError extends Error {
  receipt: TransactionReceipt | SvmReceipt | undefined

  constructor(error: any, receipt?: TransactionReceipt | SvmReceipt) {
    super(error)
    this.name = 'TransactionConfirmationError'
    this.receipt = receipt
  }
}
