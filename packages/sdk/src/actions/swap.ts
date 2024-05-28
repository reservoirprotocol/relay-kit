import type {
  Execute,
  paths,
  AdaptedWallet,
  ProgressData
} from '../types/index.js'
import { getClient } from '../client.js'
import {
  executeSteps,
  APIError,
  adaptViemWallet,
  getCurrentStepData,
  prepareCallTransaction
} from '../utils/index.js'
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { zeroAddress, type Address, type WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'
import {
  isSimulateContractRequest,
  type CallBody,
  type SimulateContractRequest
} from './call.js'

export type SwapBody = NonNullable<
  paths['/execute/swap']['post']['requestBody']['content']['application/json']
>
export type SwapBodyOptions = Omit<
  SwapBody,
  | 'destinationChainId'
  | 'originChainId'
  | 'originCurrency'
  | 'destinationCurrency'
  | 'amount'
  | 'recipient'
>

type SwapProgressData = ProgressData

export type SwapActionParameters = {
  chainId: number
  currency: string
  toChainId: number
  toCurrency: string
  amount: string
  recipient?: Address
  options?: Omit<SwapBodyOptions, 'user' | 'source' | 'txs'>
  depositGasLimit?: string
  txs?: (NonNullable<CallBody['txs']>[0] | SimulateContractRequest)[]
  onProgress?: (data: SwapProgressData) => any
} & (
  | { precheck: true; wallet?: AdaptedWallet | WalletClient } // When precheck is true, wallet is optional
  | { precheck?: false; wallet: AdaptedWallet | WalletClient }
)

/**
 * Swap crosschain using Relay
 * @param data.chainId destination chain id
 * @param data.wallet Wallet object that adheres to the AdaptedWakket interface or a viem WalletClient
 * @param data.originChainId The chain to pay the solver on
 * @param data.precheck Set to true to skip executing steps and just to get the initial steps required
 * @param data.options - {@link SwapBodyOptions}
 * @param data.onProgress Callback to update UI state as execution progresses
 */
export async function swap(data: SwapActionParameters) {
  const {
    toChainId,
    toCurrency,
    wallet,
    chainId,
    currency,
    amount,
    recipient,
    options,
    onProgress = () => {},
    precheck,
    depositGasLimit,
    txs
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
    let preparedTransactions: CallBody['txs']
    if (txs && txs.length > 0) {
      preparedTransactions = txs.map((tx) => {
        if (isSimulateContractRequest(tx)) {
          return prepareCallTransaction(
            tx as Parameters<typeof prepareCallTransaction>['0']
          )
        }
        return tx
      })
    }

    const data: SwapBody = {
      user: caller || zeroAddress,
      destinationCurrency: toCurrency,
      destinationChainId: toChainId,
      originCurrency: currency,
      originChainId: chainId,
      amount,
      recipient: recipient ? (recipient as string) : caller ?? zeroAddress,
      tradeType: options?.tradeType ?? 'EXACT_INPUT',
      source: client.source || undefined,
      txs: preparedTransactions,
      ...options
    }

    const request: AxiosRequestConfig = {
      url: `${client.baseApiUrl}/execute/swap`,
      method: 'post',
      data
    }

    if (precheck) {
      const res = await axios.request(request)
      if (res.status !== 200)
        throw new APIError(res?.data?.message, res.status, res.data)
      const data = res.data as Execute
      onProgress({
        steps: data['steps'],
        fees: data['fees'],
        breakdown: data['breakdown'],
        details: data['details']
      })
      return data
    } else {
      if (!adaptedWallet) {
        throw new Error('AdaptedWallet is required to execute steps')
      }

      await executeSteps(
        chainId,
        request,
        adaptedWallet,
        ({ steps, fees, breakdown, details }) => {
          const { currentStep, currentStepItem, txHashes } =
            getCurrentStepData(steps)

          onProgress({
            steps,
            fees,
            breakdown,
            details,
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
      )
      return true
    }
  } catch (err: any) {
    console.error(err)
    throw err
  }
}
