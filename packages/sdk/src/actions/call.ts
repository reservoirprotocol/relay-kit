import type { Execute, paths, AdaptedWallet } from '../types/index.js'
import { getClient } from '../client.js'
import {
  executeSteps,
  APIError,
  prepareCallTransaction,
  adaptViemWallet,
} from '../utils/index.js'
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import type { WalletClient, WriteContractParameters } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'

export type CallBody = NonNullable<
  paths['/execute/call']['post']['requestBody']['content']['application/json']
>
export type ExecuteStep = NonNullable<Execute['steps']>['0']
export type ExecuteStepItem = NonNullable<Execute['steps'][0]['items']>[0]
export type SimulateContractRequest = WriteContractParameters<any>

export type CallActionParamaters = {
  chainId: number
  txs: (NonNullable<CallBody['txs']>[0] | SimulateContractRequest)[]
  wallet: AdaptedWallet | WalletClient
  toChainId: number
  options?: CallBody
  precheck?: boolean
  onProgress?: (
    steps: Execute['steps'],
    fees?: Execute['fees'],
    currentStep?: ExecuteStep | null,
    currentStepItem?: ExecuteStepItem
  ) => any
}

function isSimulateContractRequest(tx: any): tx is SimulateContractRequest {
  return (tx as SimulateContractRequest).abi !== undefined
}

/**
 * Do anything crosschain by specifying txs to be executed on the target chain.
 * @param data.chainId destination chain id
 * @param data.txs An array of either transaction objects (made up of a to, data and value properties) or viem request objects returned from viem's simulateContract function.
 * @param data.wallet Wallet object that adheres to the AdaptedWakket interface or a viem WalletClient
 * @param data.originChainId The chain to pay the solver on
 * @param data.precheck Set to true to skip executing steps and just to get the initial steps required
 * @param
 * @param data.onProgress Callback to update UI state as execution progresses
 */
export async function call(data: CallActionParamaters) {
  const {
    toChainId,
    txs,
    wallet,
    chainId,
    options,
    onProgress = () => {},
    precheck,
  } = data
  const client = getClient()
  const adaptedWallet: AdaptedWallet = isViemWalletClient(wallet)
    ? adaptViemWallet(wallet as WalletClient)
    : wallet
  const caller = await adaptedWallet.address()

  if (!client.baseApiUrl || !client.baseApiUrl.length) {
    throw new ReferenceError('RelayClient missing api url configuration')
  }

  try {
    const preparedTransactions: CallBody['txs'] = txs.map((tx) => {
      if (isSimulateContractRequest(tx)) {
        return prepareCallTransaction(
          tx as Parameters<typeof prepareCallTransaction>['0']
        )
      }
      return tx
    })

    const data: CallBody = {
      user: caller,
      txs: preparedTransactions,
      originChainId: chainId,
      destinationChainId: toChainId,
      source: client.source || undefined,
      ...options,
    }

    const request: AxiosRequestConfig = {
      url: `${client.baseApiUrl}/execute/call`,
      method: 'post',
      data,
    }

    if (precheck) {
      const res = await axios.request(request)
      if (res.status !== 200)
        throw new APIError(res?.data?.message, res.status, res.data)
      const data = res.data as Execute
      onProgress(data['steps'], data['fees'])
      return data
    } else {
      await executeSteps(
        chainId,
        request,
        adaptedWallet,
        (steps: Execute['steps'], fees: Execute['fees']) => {
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

          onProgress(steps, fees, currentStep, currentStepItem)
        }
      )
      return true
    }
  } catch (err: any) {
    console.error(err)
    throw err
  }
}
