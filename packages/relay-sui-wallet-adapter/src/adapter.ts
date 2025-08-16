import {
  type AdaptedWallet,
  LogLevel,
  getClient
} from '@relayprotocol/relay-sdk'
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
      const client = getClient()

      const txData = stepItem.data.data

      if (!txData) {
        throw new Error('Transaction data not found')
      }

      const tx = Transaction.from(txData)
      const result = await signAndExecuteTransactionBlock(tx)

      client.log(
        ['Transaction digest obtained', result.digest],
        LogLevel.Verbose
      )

      return result.digest
    },
    handleConfirmTransactionStep: async (txHash) => {
      const result = await client.waitForTransaction({
        digest: txHash,
        options: {
          showEffects: true
        }
      })

      if (result.errors && result.errors.length > 0) {
        throw new Error(`Transaction failed: ${result.errors.join(', ')}`)
      }

      return { digest: result.digest }
    },
    switchChain: (chainId: number) => {
      _chainId = chainId
      return Promise.resolve()
    }
  }
}
