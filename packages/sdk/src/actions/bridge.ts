import type {
  Execute,
  AdaptedWallet,
  ExecuteStep,
  ExecuteStepItem,
  paths,
} from '../types/index.js'
import { APIError, adaptViemWallet, executeSteps } from '../utils/index.js'
import { zeroAddress, type Address, type WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'
import { getClient } from '../client.js'
import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'

export type BridgeBody = NonNullable<
  paths['/execute/bridge']['post']['requestBody']['content']['application/json']
>
export type BridgeBodyOptions = Omit<
  BridgeBody,
  'user' | 'destinationChainId' | 'originChainId' | 'amount' | 'currency'
>

export type BridgeActionParameters = {
  chainId: number
  toChainId: number
  amount: string
  currency: BridgeBody['currency']
  to?: Address
  options?: BridgeBodyOptions
  depositGasLimit?: string
  onProgress?: (
    steps: Execute['steps'],
    fees?: Execute['fees'],
    breakdown?: Execute['breakdown'],
    currentStep?: ExecuteStep | null,
    currentStepItem?: ExecuteStepItem
  ) => any
} & (
  | { precheck: true; wallet?: AdaptedWallet | WalletClient } // When precheck is true, wallet is optional
  | { precheck?: false; wallet: AdaptedWallet | WalletClient }
)

/**
 * @param data.chainId The from chain id
 * @param data.toChainId The chain to pay the solver on
 * @param data.amount The amount to bridge
 * @param data.currency The currency to bridge
 * @param data.to The address that will receive the bridge
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
    to,
    onProgress = () => {},
    precheck,
    depositGasLimit,
    options,
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
      user: to || caller || zeroAddress,
      originChainId: chainId,
      destinationChainId: toChainId,
      currency,
      amount,
      source: client.source || undefined,
      ...options,
    }

    const request: AxiosRequestConfig = {
      url: `${client.baseApiUrl}/execute/bridge`,
      method: 'post',
      data,
    }

    if (precheck) {
      const res = await axios.request(request)
      if (res.status !== 200)
        throw new APIError(res?.data?.message, res.status, res.data)
      const data = res.data as Execute
      onProgress(data['steps'], data['fees'], data['breakdown'])
      return data
    } else {
      if (!adaptedWallet) {
        throw new Error('AdaptedWallet is required to execute steps')
      }

      await executeSteps(
        chainId,
        request,
        adaptedWallet,
        (
          steps: Execute['steps'],
          fees: Execute['fees'],
          breakdown: Execute['breakdown']
        ) => {
          let currentStep: NonNullable<Execute['steps']>['0'] | null = null
          let currentStepItem:
            | NonNullable<Execute['steps'][0]['items']>[0]
            | undefined

          for (const step of steps) {
            for (const item of step.items || []) {
              if (item.status === 'incomplete') {
                currentStep = step
                currentStepItem = item
                break // Exit the inner loop once the first incomplete item is found
              }
            }
            if (currentStep && currentStepItem) break // Exit the outer loop if the current step and item have been found
          }

          onProgress(steps, fees, breakdown, currentStep, currentStepItem)
        },
        undefined,
        depositGasLimit
          ? {
              deposit: {
                gasLimit: depositGasLimit,
              },
            }
          : undefined
      )
      return true
    }
  } catch (err: any) {
    console.error(err)
    throw err
  }
}
