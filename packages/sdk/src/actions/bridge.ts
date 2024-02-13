import type { Execute, paths, AdaptedWallet } from '../types/index.js'
import {
  adaptViemWallet,
} from '../utils/index.js'
import type { Address, WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'
import { call } from './call.js'

type CallBody = NonNullable<
  paths['/execute/call']['post']['requestBody']['content']['application/json']
>

type Data = {
  chainId: number
  value: string
  to?: Address
  wallet: AdaptedWallet | WalletClient
  toChainId: number
  options?: CallBody
  precheck?: boolean
  onProgress?: (steps: Execute['steps'], fees?: Execute['fees']) => any
}

/**
 * Method to abstract call action parameters
 * @param data.chainId destination chain id
 * @param data.value Value to bridge, wei value represented as a string
 * @param data.to Address of the receiver of funds on the provided chain id
 * @param data.wallet Wallet object that adheres to the AdaptedWakket interface or a viem WalletClient
 * @param data.originChainId The chain to pay the solver on
 * @param data.precheck Set to true to skip executing steps and just to get the initial steps required
 * @param data.onProgress Callback to update UI state as execution progresses
 */
export async function bridge(data: Data) {
  const {
    to,
    wallet,
    value,
    ...proxiedData
  } = data
  const adaptedWallet: AdaptedWallet = isViemWalletClient(wallet)
    ? adaptViemWallet(wallet as WalletClient)
    : wallet
  const caller = await adaptedWallet.address()

  return call({
    wallet: adaptedWallet,
    txs: [{
      to:  to ?? caller,
      value
    }],
    ...proxiedData
  })
}