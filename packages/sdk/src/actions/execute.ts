import type { AdaptedWallet, ProgressData, Execute } from '../types/index.js'
import { getClient } from '../client.js'
import {
  executeSteps,
  adaptViemWallet,
  getCurrentStepData
} from '../utils/index.js'
import { type WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'
import { cloneDeep } from 'lodash-es'

export type ExecuteActionParameters = {
  quote: Execute
  wallet: AdaptedWallet | WalletClient
  depositGasLimit?: string
  onProgress?: (data: ProgressData) => any
}

/**
 * Execute crosschain using Relay
 * @param data.quote A Relay quote retrieved using {@link getQuote}
 * @param data.chainId destination chain id
 * @param data.wallet Wallet object that adheres to the AdaptedWakket interface or a viem WalletClient
 * @param data.options - {@link ExecuteActionParameters}
 * @param data.onProgress Callback to update UI state as execution progresses
 */
export async function execute(data: ExecuteActionParameters) {
  const { quote, wallet, depositGasLimit, onProgress } = data
  const client = getClient()

  if (!client.baseApiUrl || !client.baseApiUrl.length) {
    throw new ReferenceError('RelayClient missing api url configuration')
  }

  let adaptedWallet: AdaptedWallet | undefined
  if (wallet) {
    adaptedWallet = isViemWalletClient(wallet)
      ? adaptViemWallet(wallet as WalletClient)
      : wallet
  }

  try {
    if (!adaptedWallet) {
      throw new Error('AdaptedWallet is required to execute steps')
    }

    const chainId = quote.details?.currencyIn?.currency?.chainId

    if (chainId === undefined) {
      throw new Error('Missing chainId from quote')
    }

    const modifiableQuote = cloneDeep(quote)

    const data = await executeSteps(
      chainId,
      undefined,
      adaptedWallet,
      ({ steps, fees, breakdown, details }) => {
        const { currentStep, currentStepItem, txHashes } =
          getCurrentStepData(steps)

        onProgress?.({
          steps,
          fees,
          breakdown,
          details,
          currentStep,
          currentStepItem,
          txHashes
        })
      },
      modifiableQuote,
      depositGasLimit
        ? {
            deposit: {
              gasLimit: depositGasLimit
            }
          }
        : undefined
          ? {
              deposit: {
                gasLimit: depositGasLimit
              }
            }
          : undefined
    )
    return data
  } catch (err: any) {
    console.error(err)
    throw err
  }
}
