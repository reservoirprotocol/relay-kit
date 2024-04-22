import { type Address } from 'viem'
import type { Execute, ExecuteStep, ExecuteStepItem } from '../types/Execute.js'

export type ProgressData = {
  steps: Execute['steps']
  fees?: Execute['fees']
  breakdown?: Execute['breakdown']
  currentStep?: ExecuteStep | null
  currentStepItem?: ExecuteStepItem
  txHashes?: { txHash: Address; chainId: number }[]
}
