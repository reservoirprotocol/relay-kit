import type { Execute, AdaptedWallet } from '../types/index.js'
import { adaptViemWallet } from '../utils/index.js'
import { zeroAddress, type Address, type WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'
import {
  call,
  type CallBodyOptions,
  type ExecuteStep,
  type ExecuteStepItem,
} from './call.js'

export type BridgeActionParameters = {
  chainId: number
  value: string
  to?: Address
  toChainId: number
  options?: CallBodyOptions
  depositGasLimit?: string
  onProgress?: (
    steps: Execute['steps'],
    fees?: Execute['fees'],
    breakdown?: Execute['breakdown'],
    currentStep?: ExecuteStep | null,
    currentStepItem?: ExecuteStepItem,
  ) => any
} & (
  | { precheck: true; wallet?: AdaptedWallet | WalletClient } // When precheck is true, wallet is optional
  | { precheck?: false; wallet: AdaptedWallet | WalletClient }
)

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
export async function bridge(data: BridgeActionParameters) {
  const { to, wallet, value, precheck, ...proxiedData } = data

  let adaptedWallet: AdaptedWallet | undefined
  let caller: string | undefined

  if (wallet) {
    adaptedWallet = isViemWalletClient(wallet)
      ? adaptViemWallet(wallet as WalletClient)
      : wallet
    caller = await adaptedWallet.address()
  }

  if (!precheck && !adaptedWallet) {
    throw new Error(
      'Wallet is required when precheck is false or not provided.',
    )
  }

  return call({
    ...proxiedData,
    wallet: adaptedWallet as AdaptedWallet,
    txs: [
      {
        to: to ?? caller ?? zeroAddress,
        value,
      },
    ],
    precheck,
  })
}
