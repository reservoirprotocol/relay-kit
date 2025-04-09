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
      let txData
      try {
        txData = JSON.parse(stepItem.data.data)
      } catch (error) {
        throw new Error(`Failed to parse transaction data`)
      }

      console.log('txData: ', txData)

      const test = Transaction.from(stepItem.data.data)
      console.log('test: ', test)

      // Create a new transaction from the serialized data
      // const tx = Transaction.from(txData)

      // console.log('tx: ', tx)

      const result = await signAndExecuteTransactionBlock(test)
      console.log('result: ', result)

      return result.digest

      // Execute the transaction
      // const result = await client.signAndExecuteTransaction({
      //   signer: client.,
      //   transaction: tx,
      //   options: {
      //     showEffects: true,
      //     showEvents: true
      //   }
      // })

      return
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

      // @TODO: add logs

      console.log('result', result)

      throw new Error('Transaction confirmation not implemented for Sui')
    },
    switchChain: (chainId: number) => {
      _chainId = chainId
      return Promise.resolve()
    }
  }
}
