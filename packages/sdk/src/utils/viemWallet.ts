import type { AdaptedWallet } from '../types/index.js'
import { LogLevel } from './logger.js'
import { getClient } from '../client.js'
import type { Account, Address, Hex, WalletClient } from 'viem'
import { createPublicClient, custom, fallback, hexToBigInt, http } from 'viem'

export function isViemWalletClient(
  wallet: WalletClient | AdaptedWallet
): wallet is WalletClient {
  return (
    (wallet as WalletClient).extend !== undefined &&
    (wallet as WalletClient).getPermissions !== undefined
  )
}

export const adaptViemWallet = (wallet: WalletClient): AdaptedWallet => {
  return {
    vmType: 'evm',
    getChainId: async () => {
      return wallet.getChainId()
    },
    transport: custom(wallet.transport),
    address: async () => {
      let address = wallet.account?.address
      if (!address) {
        ;[address] = await wallet.getAddresses()
      }
      return address
    },
    handleSignMessageStep: async (stepItem) => {
      const client = getClient()
      const signData = stepItem.data?.sign
      let signature: string | undefined
      if (signData) {
        if (signData.signatureKind === 'eip191') {
          client.log(['Execute Steps: Signing with eip191'], LogLevel.Verbose)
          if (signData.message.match(/0x[0-9a-fA-F]{64}/)) {
            signature = await wallet.signMessage({
              account: wallet.account as Account,
              message: {
                raw: signData.message as Hex
              }
            })
          } else {
            signature = await wallet.signMessage({
              account: wallet.account as Account,
              message: signData.message
            })
          }
        } else if (signData.signatureKind === 'eip712') {
          client.log(['Execute Steps: Signing with eip712'], LogLevel.Verbose)
          signature = await wallet.signTypedData({
            account: wallet.account as Account,
            domain: signData.domain as any,
            types: signData.types as any,
            primaryType: signData.primaryType,
            message: signData.value
          })
        }
      }
      return signature
    },
    handleSendTransactionStep: async (chainId, stepItem) => {
      const client = getClient()
      console.log('[DEBUG] Gate.io Transaction - Starting transaction step', {
        chainId,
        stepItem
      })
      const stepData = stepItem.data
      const chain = client.chains.find(
        (chain) => chain.id === chainId
      )?.viemChain

      console.log('[DEBUG] Gate.io Transaction - Chain verification', {
        foundChain: !!chain,
        chainDetails: chain
      })

      if (!chain) {
        console.error('[DEBUG] Gate.io Transaction - Chain not found error')
        throw 'Chain not found when sending transaction'
      }

      console.log('[DEBUG] Gate.io Transaction - Preparing transaction parameters', {
        chain,
        data: stepData.data,
        account: wallet.account ?? stepData.from,
        to: stepData.to,
        value: (stepData.value as any) || 0,
        maxFeePerGas: stepData.maxFeePerGas,
        maxPriorityFeePerGas: stepData.maxPriorityFeePerGas,
        gas: stepData.gas
      })

      try {
        client.log(['Execute Steps: Sending transaction'], LogLevel.Verbose)
        const hash = await wallet.sendTransaction({
          chain,
          data: stepData.data,
          account: wallet.account ?? stepData.from,
          to: stepData.to,
          value: hexToBigInt((stepData.value as any) || 0),
          ...(stepData.maxFeePerGas && {
            maxFeePerGas: hexToBigInt(stepData.maxFeePerGas as any)
          }),
          ...(stepData.maxPriorityFeePerGas && {
            maxPriorityFeePerGas: hexToBigInt(
              stepData.maxPriorityFeePerGas as any
            )
          }),
          ...(stepData.gas && {
            gas: hexToBigInt(stepData.gas as any)
          })
        })
        console.log('[DEBUG] Gate.io Transaction - Transaction sent successfully', {
          hash,
          chainId
        })
        return hash
      } catch (error) {
        console.error('[DEBUG] Gate.io Transaction - Error sending transaction', {
          error,
          chainId,
          stepItem
        })
        throw error
      }
    },
    handleConfirmTransactionStep: async (
      txHash,
      chainId,
      onReplaced,
      onCancelled
    ) => {
      const client = getClient()
      const chain = client.chains.find((chain) => chain.id === chainId)

      const viemClient = createPublicClient({
        chain: chain?.viemChain,
        transport: wallet.transport
          ? fallback([custom(wallet.transport), http()])
          : http()
      })

      const receipt = await viemClient.waitForTransactionReceipt({
        hash: txHash as Address,
        onReplaced: (replacement) => {
          if (replacement.reason === 'cancelled') {
            onCancelled()
            throw Error('Transaction cancelled')
          }
          onReplaced(replacement.transaction.hash)
        }
      })

      return receipt
    },
    switchChain: async (chainId: number) => {
      try {
        await wallet.switchChain({
          id: chainId
        })
        return
      } catch (e: any) {
        if (e && e?.message) {
          if (e.message.includes('does not support the requested chain')) {
            throw new Error('Wallet does not support chain')
          } else if (e.message.includes('rejected')) {
            throw e
          } else if (e.message.includes('already pending')) {
            return
          }
        }
        const client = getClient()
        const chain = client.chains.find((chain) => chain.id === chainId)
        if (!chain) {
          throw 'Chain missing from Relay Client'
        }
        await wallet.addChain({
          chain: chain?.viemChain!
        })
        return
      }
    }
  }
}
