import type { AdaptedWallet, ProgressData, Execute } from '../types/index.js'
import { getClient } from '../client.js'
import {
  executeSteps,
  adaptViemWallet,
  getCurrentStepData
} from '../utils/index.js'
import { type WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'

export type ExecuteActionParameters = {
  quote: Execute
  wallet: AdaptedWallet | WalletClient
  depositGasLimit?: string
  onProgress?: (data: ProgressData) => any
}

/**
 * Execute crosschain using Relay
 * @param data.quote A Relay quote retrieved using {@link getQuote}
 * @param data.depositGasLimit A gas limit to use in base units (wei, etc)
 * @param data.wallet Wallet object that adheres to the AdaptedWakket interface or a viem WalletClient
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

    function safeStructuredClone<T>(obj: T): T {
      if (typeof structuredClone === 'function') {
        return structuredClone(obj);
      }
      // Fallback implementation, for Chrome < 98 (before 2022)
      return JSON.parse(JSON.stringify(obj));
    }

    const { request, ...restOfQuote } = quote
    const _quote = safeStructuredClone(restOfQuote)

    const data = await executeSteps(
      chainId,
      request,
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
      _quote,
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
