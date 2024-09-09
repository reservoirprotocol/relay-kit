import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { LogLevel, getClient, type AdaptedWallet } from '@reservoir0x/relay-sdk'
import type { Address } from 'viem'

export const adaptSolanaWallet = (
  connection: Connection,
  keypair: Keypair
): AdaptedWallet => {
  return {
    getChainId: async () => {
      // Solana doesn't have a chainId concept like Ethereum
      // @TODO: implement mapping of svm chain names to chainIds
      return 792703809
    },
    address: async () => {
      return keypair.publicKey.toBase58()
    },
    handleSignMessageStep: async () => {
      throw new Error('Message signing not implemented for Solana')
    },
    handleSendTransactionStep: async (_chainId, stepItem) => {
      const client = getClient()
      client.log(
        ['Execute Steps: Sending Solana transaction'],
        LogLevel.Verbose
      )

      const instructions =
        stepItem?.data?.instructions?.map(
          (i) =>
            new TransactionInstruction({
              keys: i.keys.map((k) => ({
                isSigner: k.isSigner,
                isWritable: k.isWritable,
                pubkey: new PublicKey(k.pubkey)
              })),
              programId: new PublicKey(i.programId),
              data: Buffer.from(i.data, 'hex')
            })
        ) ?? []

      const messageV0 = new TransactionMessage({
        payerKey: keypair.publicKey,
        instructions,
        recentBlockhash: await connection
          .getLatestBlockhash()
          .then((b) => b.blockhash)
      }).compileToV0Message(
        await Promise.all(
          stepItem?.data?.addressLookupTableAddresses?.map(
            async (address: string) =>
              await connection
                .getAddressLookupTable(new PublicKey(address))
                .then((res) => res.value as AddressLookupTableAccount)
          ) ?? []
        )
      )

      const transaction = new VersionedTransaction(messageV0)
      transaction.sign([keypair])

      const signature = await connection.sendTransaction(transaction)
      return signature
    },
    handleConfirmTransactionStep: async (
      txHash
      // chainId,
      // onReplaced,
      // onCancelled
    ) => {
      const client = getClient()
      client.log(['Confirming Solana transaction'], LogLevel.Verbose)

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed')

      const result = await connection.confirmTransaction({
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
        signature: txHash
      })

      client.log(['Solana transaction result: ', result], LogLevel.Verbose)

      if (result.value.err) {
        throw new Error(`Transaction failed: ${result.value.err}`)
      }

      // Solana doesn't have a concept of replaced transactions
      // So we don't need to handle onReplaced and onCancelled

      client.log({
        blockHash: result.context.slot.toString(),
        blockNumber: result.context.slot,
        transactionHash: txHash as Address
      } as any)

      return undefined

      // return {
      //   blockHash: result.context.slot.toString(),
      //   blockNumber: result.context.slot,
      //   transactionHash: txHash as Address
      // }
    }
  }
}
