import type { CustomTransport, HttpTransport, TransactionReceipt } from 'viem'
import type { Execute } from './Execute.js'
import type { SignatureStepItem } from './SignatureStepItem.js'
import type { TransactionStepItem } from './TransactionStepItem.js'

export type AdaptedWallet = {
  getChainId: () => Promise<number>
  handleSignMessageStep: (
    item: SignatureStepItem,
    step: Execute['steps'][0]
  ) => Promise<string | undefined>
  handleSendTransactionStep: (
    chainId: number,
    item: TransactionStepItem,
    step: Execute['steps'][0]
  ) => Promise<`0x${string}` | undefined>
  handleConfirmTransactionStep: (
    tx: string
  ) => Promise<TransactionReceipt | undefined>
  address: () => Promise<string>
  transport?: CustomTransport | HttpTransport
}
