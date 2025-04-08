import {
  type AdaptedWallet
  // LogLevel,
  // getClient,
  // type TransactionStepItem
} from '@reservoir0x/relay-sdk'
// import { SuiClient } from '@mysten/sui/client'
// import { type Transaction } from '@mysten/sui/transactions'

export const adaptSuiWallet = (
  walletAddress: string,
  chainId: number
  // suiClient: SuiClient,
  // signAndExecuteTransactionBlock: (
  //   tx: Transaction
  // ) => Promise<{ digest: string }>
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
    handleSendTransactionStep: async (
      _chainId
      // stepItem
    ) => {
      // const client = getClient()
      // TODO: Implement Sui transaction handling
      throw new Error('Transaction sending not implemented for Sui')
    },
    handleConfirmTransactionStep: async () =>
      // txHash
      {
        // TODO: Implement Sui transaction confirmation
        throw new Error('Transaction confirmation not implemented for Sui')
      },
    switchChain: (chainId: number) => {
      _chainId = chainId
      return Promise.resolve()
    }
  }
}
