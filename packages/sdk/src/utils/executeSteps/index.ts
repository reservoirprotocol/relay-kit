import type {
  Execute,
  AdaptedWallet,
  TransactionStepItem
} from '../../types/index.js'
import type { AxiosRequestConfig } from 'axios'
import { getClient } from '../../client.js'
import { LogLevel } from '../logger.js'
import {
  canBatchTransactions,
  prepareBatchTransaction
} from '../prepareBatchTransaction.js'
import { handleSignatureStepItem } from './signatureStep.js'
import { handleTransactionStepItem } from './transactionStep.js'

export type SetStateData = Pick<
  Execute,
  'steps' | 'fees' | 'breakdown' | 'details' | 'error' | 'refunded'
>

/**
 * This function orchestrates the execution of multi-step operations returned from the Relay Quote API,
 * such as bridging, swapping tokens, or performing cross-chain calls. It handles transaction
 * signing, submission, and validation while providing real-time progress updates through the setState callback.
 *
 * @param chainId - The origin chain ID for execution
 * @param request - AxiosRequestConfig for API requests
 * @param wallet - Wallet adapter implementing the {@link AdaptedWallet} interface
 * @param setState - Callback function to update UI state during execution progress
 * @param newJson - Execute object containing the steps, fees, and details from Relay Quote API
 * @param stepOptions - Optional configuration for specific steps (e.g., gas limits)
 * @returns Promise<Execute> - The final execution result with updated status
 */

export async function executeSteps(
  chainId: number,
  request: AxiosRequestConfig = {},
  wallet: AdaptedWallet,
  setState: (data: SetStateData) => any,
  newJson: Execute,
  stepOptions?: {
    [stepId: string]: {
      gasLimit?: string
    }
  }
) {
  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  const client = getClient()

  if (client?.baseApiUrl) {
    request.baseURL = client.baseApiUrl
  }

  const pollingInterval = client.pollingInterval ?? 5000

  const maximumAttempts =
    client.maxPollingAttemptsBeforeTimeout ??
    (2.5 * 60 * 1000) / pollingInterval

  const chain = client.chains.find((chain) => chain.id === chainId)
  if (!chain) {
    throw `Unable to find chain: Chain id ${chainId}`
  }

  // @TODO: check for websocket

  let json = newJson
  let isAtomicBatchSupported = false
  try {
    // Handle errors
    if (json.error || !json.steps) throw json

    // Check if step's transactions can be batched and if wallet supports atomic batch (EIP-5792)
    // If so, manipulate steps to batch transactions
    if (canBatchTransactions(json.steps)) {
      isAtomicBatchSupported = Boolean(
        wallet?.supportsAtomicBatch &&
          (await wallet?.supportsAtomicBatch(chainId))
      )
      if (isAtomicBatchSupported) {
        const batchedStep = prepareBatchTransaction(json.steps)
        json.steps = [batchedStep]
      }
    }

    // Update state on first call or recursion
    setState({
      steps: [...json?.steps],
      fees: { ...json?.fees },
      breakdown: json?.breakdown,
      details: json?.details
    })

    let incompleteStepIndex = -1
    let incompleteStepItemIndex = -1
    json.steps.find((step, i) => {
      if (!step.items) {
        return false
      }

      incompleteStepItemIndex = step.items.findIndex(
        (item) => item.status == 'incomplete'
      )
      if (incompleteStepItemIndex !== -1) {
        incompleteStepIndex = i
        return true
      }
    })

    // There are no more incomplete steps
    if (incompleteStepIndex === -1) {
      client.log(['Execute Steps: all steps complete'], LogLevel.Verbose)
      return json
    }

    const step = json.steps[incompleteStepIndex]

    if (stepOptions && stepOptions[step.id]) {
      const currentStepOptions = stepOptions[step.id]
      step.items?.forEach((stepItem) => {
        if (currentStepOptions.gasLimit) {
          stepItem.data.gas = currentStepOptions.gasLimit
        }
      })
    }

    let stepItems = json.steps[incompleteStepIndex].items

    if (!stepItems) {
      client.log(
        ['Execute Steps: skipping step, no items in step'],
        LogLevel.Verbose
      )
      return json
    }

    let { kind } = step
    let stepItem = stepItems[incompleteStepItemIndex]

    // @TODO: verify
    // If step item is missing data, throw error
    if (!stepItem.data) {
      throw `Step item is missing data`
    }

    client.log(
      [`Execute Steps: Begin processing step items for: ${step.action}`],
      LogLevel.Verbose
    )

    const promises = stepItems
      .filter((stepItem) => stepItem.status === 'incomplete')
      .map((stepItem) => {
        return new Promise(async (resolve, reject) => {
          try {
            // Handle each step based on it's kind
            switch (kind) {
              // Make an on-chain transaction
              case 'transaction': {
                await handleTransactionStepItem({
                  stepItem: stepItem as TransactionStepItem,
                  step,
                  wallet,
                  setState,
                  request,
                  client,
                  json,
                  chainId,
                  isAtomicBatchSupported,
                  incompleteStepItemIndex,
                  stepItems
                })
                break
              }

              // Sign a message
              case 'signature': {
                await handleSignatureStepItem({
                  stepItem,
                  step,
                  wallet,
                  setState,
                  request,
                  client,
                  json,
                  maximumAttempts,
                  pollingInterval,
                  chain
                })
                break
              }

              default:
                throw new Error(
                  `Unknown step kind: ${kind}. Expected 'signature' or 'transaction'`
                )
            }

            // Mark step item as complete
            stepItem.status = 'complete'
            stepItem.progressState = 'complete'
            stepItem.isValidatingSignature = false
            setState({
              steps: [...json?.steps],
              fees: { ...json?.fees },
              breakdown: json?.breakdown,
              details: json?.details
            })
            resolve(stepItem)
          } catch (e) {
            const error = e as Error
            const errorMessage = error
              ? error.message
              : 'Error: something went wrong'

            if (error && json?.steps) {
              json.steps[incompleteStepIndex].error = errorMessage
              stepItem.error = errorMessage
              stepItem.errorData = (e as any)?.response?.data || e
              stepItem.isValidatingSignature = false
              setState({
                steps: [...json?.steps],
                fees: { ...json?.fees },
                breakdown: json?.breakdown,
                details: json?.details
              })
            }
            reject(error)
          }
        })
      })

    await Promise.all(promises)

    // Recursively call executeSteps()
    return await executeSteps(
      chainId,
      request,
      wallet,
      setState,
      json,
      stepOptions
    )
  } catch (err: any) {
    client.log(['Execute Steps: An error occurred', err], LogLevel.Error)
    const error = err && err?.response?.data ? err.response.data : err
    let refunded = false
    if (error && error.message) {
      refunded = error.message.includes('Refunded')
    } else if (error && error.includes) {
      refunded = error.includes('Refunded')
    }

    if (json) {
      json.error = error
      setState({
        steps: json.steps ? [...json.steps] : ([{}] as any),
        fees: { ...json?.fees },
        breakdown: json?.breakdown,
        details: json?.details,
        refunded: refunded,
        error
      })
    } else {
      json = {
        error,
        steps: [],
        refunded
      }
      setState(json)
    }
    throw err
  }
}
