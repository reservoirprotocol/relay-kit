import type { AdaptedWallet, ProgressData, Execute } from '../types/index.js'
import { getClient } from '../client.js'
import {
  executeSteps,
  adaptViemWallet,
  getCurrentStepData,
  safeStructuredClone
} from '../utils/index.js'
import { type WalletClient } from 'viem'
import { isViemWalletClient } from '../utils/viemWallet.js'
import { isDeadAddress } from '../constants/address.js'

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

    if (isDeadAddress(quote?.details?.recipient)) {
      throw new Error('Recipient should never be burn address')
    }

    const { request, ...restOfQuote } = quote
    const _quote = safeStructuredClone(restOfQuote)

    const data = await executeSteps(
      chainId,
      request,
      adaptedWallet,
      ({ steps, fees, breakdown, details, refunded, error }) => {
        const { currentStep, currentStepItem, txHashes } =
          getCurrentStepData(steps)

        onProgress?.({
          steps,
          fees,
          breakdown,
          details,
          currentStep,
          currentStepItem,
          txHashes,
          refunded,
          error
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
    )
    return data
  } catch (err: any) {
    console.error(err)
    throw err
  }
}
