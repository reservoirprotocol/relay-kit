import {
  type AdaptedWallet
  // LogLevel,
  // getClient,
  // type TransactionStepItem
} from '@reservoir0x/relay-sdk'
import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

export const adaptSuiWallet = (
  walletAddress: string,
  chainId: number,
  client: SuiClient,
  signAndExecuteTransactionBlock: (
    tx: Transaction
  ) => Promise<{ digest: string }>
): AdaptedWallet => {
  let _chainId = chainId
  const getChainId = async () => {
    return _chainId
  }

  return {
    vmType: 'suivm',
    getChainId,
    address: async () => {
      return walletAddress
    },
    handleSignMessageStep: async () => {
      throw new Error('Message signing not implemented for Sui')
    },
    handleSendTransactionStep: async (_chainId, stepItem) => {
      const txData = stepItem.data.data

      const tx = Transaction.from(txData)

      const result = await signAndExecuteTransactionBlock(tx)

      console.log('result: ', result)

      return result.digest
    },
    handleConfirmTransactionStep: async (txHash) => {
      // @TODO: maybe use getTransactionBlock instead
      const result = await client.waitForTransaction({
        digest: txHash,
        options: {
          showBalanceChanges: true,
          showEffects: true
        }
      })

      console.log('result', result)

      return { digest: result.digest }

      // @TODO: add logs

      // throw new Error('Transaction confirmation not implemented for Sui')
    },
    switchChain: (chainId: number) => {
      _chainId = chainId
      return Promise.resolve()
    }
  }
}
