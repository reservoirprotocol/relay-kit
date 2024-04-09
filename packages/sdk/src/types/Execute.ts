import type { Address } from 'viem'
import type { paths } from './api.js'

export type CallFees =
  paths['/execute/call']['post']['responses']['200']['content']['application/json']['fees']
export type CallBreakdown =
  paths['/execute/call']['post']['responses']['200']['content']['application/json']['breakdown']
export type CheckApi = NonNullable<
  NonNullable<
    paths['/execute/call']['post']['responses']['200']['content']['application/json']['steps']
  >['0']['items']
>[0]['check']

export type Execute = {
  errors?: { message?: string; orderId?: string }[]
  fees?: CallFees
  breakdown?: CallBreakdown
  error?: any // Manually added client error
  steps: {
    error?: string
    errorData?: any
    action: string
    description: string
    kind: 'transaction' | 'signature'
    id: string
    items?: {
      status: 'complete' | 'incomplete'
      data?: any
      check?: CheckApi
      orderIndexes?: number[]
      orderIds?: string[]
      // Manually added
      error?: string
      txHashes?: {
        txHash: Address
        chainId: number
      }[]
      internalTxHashes?: {
        txHash: Address
        chainId: number
      }[]
      errorData?: any
      orderData?: {
        crossPostingOrderId?: string
        orderId: string
        orderIndex: string
      }[]
      isValidatingSignature?: boolean
    }[]
  }[]
}

export type ExecuteStep = NonNullable<Execute['steps']>['0']
export type ExecuteStepItem = NonNullable<Execute['steps'][0]['items']>[0]
