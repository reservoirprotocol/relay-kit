import { LogLevel, getClient, type AdaptedWallet } from '@reservoir0x/relay-sdk'
import * as bitcoin from 'bitcoinjs-lib'

type DynamicSignPsbtParams = {
  allowedSighash: number[] // Only allow SIGHASH_ALL
  unsignedPsbtBase64: string // The unsigned PSBT in Base64 format
  signature: Array<{
    address: string // The address that is signing
    signingIndexes: number[] // The index of the input being signed
  }>
}

export const adaptBitcoinWallet = (
  walletAddress: string,
  signPsbt: (
    address: string,
    psbt: bitcoin.Psbt,
    dynamicParams: DynamicSignPsbtParams
  ) => Promise<string>
): AdaptedWallet => {
  return {
    vmType: 'bvm',
    getChainId: async () => {
      return 8253038
    },
    address: async () => {
      return walletAddress
    },
    handleSignMessageStep: async () => {
      throw new Error('Message signing not implemented for Bitcoin')
    },
    handleSendTransactionStep: async (_chainId, stepItem) => {
      const client = getClient()

      const psbtHex: string = stepItem.data.psbt

      const psbt = bitcoin.Psbt.fromHex(psbtHex, {
        network: bitcoin.networks.bitcoin
      })

      const dynamicParams: DynamicSignPsbtParams = {
        allowedSighash: [1], // Only allow SIGHASH_ALL
        unsignedPsbtBase64: psbtHex, // The unsigned PSBT in Base64 format
        signature: [
          {
            address: walletAddress, // The address that is signing
            signingIndexes: [0] // The index of the input being signed
          }
        ]
      }

      const signedPsbt = await signPsbt(walletAddress, psbt, dynamicParams)

      client.log(['PSBT Signed', signedPsbt], LogLevel.Verbose)
      console.log(psbt.extractTransaction().toHex(), 'HEX')
      return signedPsbt
    },
    //Bitcoin txs can take 10m or more to finalize, in the case of chains that have a long block time (2m+), the SDK will skip waiting for confirmation
    handleConfirmTransactionStep: async () => {
      throw 'Not implemented'
    },
    //@ts-ignore
    switchChain: (chainId: number) => {
      throw 'Not yet implemented'
    }
  }
}
