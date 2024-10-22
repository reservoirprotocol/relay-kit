import type { CustomTransport, HttpTransport, TransactionReceipt } from 'viem'
import type { Execute } from './Execute.js'
import type { SignatureStepItem } from './SignatureStepItem.js'
import type { TransactionStepItem } from './TransactionStepItem.js'
import type { ChainVM } from './RelayChain.js'

export type SvmReceipt = {
  blockHash: string
  blockNumber: number
  txHash: string
}

export type AdaptedWallet = {
  vmType: ChainVM
  getChainId: () => Promise<number>
  handleSignMessageStep: (
    item: SignatureStepItem,
    step: Execute['steps'][0]
  ) => Promise<string | undefined>
  handleSendTransactionStep: (
    chainId: number,
    item: TransactionStepItem,
    step: Execute['steps'][0]
  ) => Promise<string | undefined>
  handleConfirmTransactionStep: (
    tx: string,
    chainId: number,
    onReplaced: (replacementTxHash: string) => void,
    onCancelled: () => void
  ) => Promise<
    | TransactionReceipt // evm
    | SvmReceipt // svm
  >
  address: () => Promise<string>
  switchChain: (chainId: number) => Promise<void>
  transport?: CustomTransport | HttpTransport
}
