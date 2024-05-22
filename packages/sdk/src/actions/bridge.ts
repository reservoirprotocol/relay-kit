import type { Execute, AdaptedWallet, paths, CallFees } from '../types/index.js'
import {
  APIError,
  adaptViemWallet,
  executeSteps,
  getCurrentStepData
} from '../utils/index.js'
import { zeroAddress, type Address, type WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'
import { getClient } from '../client.js'
import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'
import type { CallProgressData } from './call.js'

export type BridgeBody = NonNullable<
  paths['/execute/bridge']['post']['requestBody']['content']['application/json']
>
export type BridgeBodyOptions = Omit<
  BridgeBody,
  | 'user'
  | 'destinationChainId'
  | 'originChainId'
  | 'amount'
  | 'currency'
  | 'recipient'
>

export type BridgeActionParameters = {
  chainId: number
  toChainId: number
  amount: string
  currency: BridgeBody['currency']
  recipient?: Address
  options?: BridgeBodyOptions
  depositGasLimit?: string
  onProgress?: (data: CallProgressData) => any
} & (
  | { precheck: true; wallet?: AdaptedWallet | WalletClient } // When precheck is true, wallet is optional
  | { precheck?: false; wallet: AdaptedWallet | WalletClient }
)

/**
 * @param data.chainId The from chain id
 * @param data.toChainId The chain to pay the solver on
 * @param data.amount The amount to bridge
 * @param data.currency The currency to bridge
 * @param data.recipient The address that will receive the bridge
 * @param data.wallet Wallet object that adheres to the AdaptedWakket interface or a viem WalletClient
 * @param data.precheck Set to true to skip executing steps and just to get the initial steps required
 * @param data.options - {@link BridgeBodyOptions}
 * @param data.onProgress Callback to update UI state as execution progresses
 */

export async function bridge(data: BridgeActionParameters) {
  const {
    chainId,
    toChainId,
    wallet,
    amount,
    currency = 'eth',
    recipient,
    onProgress = () => {},
    precheck,
    depositGasLimit,
    options
  } = data
  const client = getClient()

  if (!client.baseApiUrl || !client.baseApiUrl.length) {
    throw new ReferenceError('RelayClient missing api url configuration')
  }

  let adaptedWallet: AdaptedWallet | undefined
  let caller: string | undefined
  if (wallet) {
    adaptedWallet = isViemWalletClient(wallet)
      ? adaptViemWallet(wallet as WalletClient)
      : wallet
    caller = await adaptedWallet.address()
  }

  // Ensure wallet is provided when precheck is false or undefined
  if (!precheck && !adaptedWallet) {
    throw new Error(
      'Wallet is required when precheck is false or not provided.'
    )
  }

  try {
    const data: BridgeBody = {
      user: caller || zeroAddress,
      recipient: recipient,
      originChainId: chainId,
      destinationChainId: toChainId,
      currency,
      amount,
      source: client.source || undefined,
      useForwarder: false,
      ...options
    }

    const request: AxiosRequestConfig = {
      url: `${client.baseApiUrl}/execute/bridge`,
      method: 'post',
      data
    }

    if (precheck) {
      const res = await axios.request(request)
      if (res.status !== 200)
        throw new APIError(res?.data?.message, res.status, res.data)
      const data = res.data as Omit<Execute, 'fees'> & { fees: CallFees }
      onProgress({
        steps: data['steps'],
        fees: data['fees'] as CallFees,
        breakdown: data['breakdown']
      })
      return data
    } else {
      if (!adaptedWallet) {
        throw new Error('AdaptedWallet is required to execute steps')
      }

      return (await executeSteps(
        chainId,
        request,
        adaptedWallet,
        ({ steps, fees, breakdown }) => {
          const { currentStep, currentStepItem, txHashes } =
            getCurrentStepData(steps)

          onProgress({
            steps,
            fees: fees as CallFees,
            breakdown,
            currentStep,
            currentStepItem,
            txHashes
          })
        },
        undefined,
        depositGasLimit
          ? {
              deposit: {
                gasLimit: depositGasLimit
              }
            }
          : undefined
      )) as Omit<Execute, 'fees'> & { fees: CallFees }
    }
  } catch (err: any) {
    console.error(err)
    throw err
  }
}
