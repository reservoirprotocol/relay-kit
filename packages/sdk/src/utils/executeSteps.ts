import type {
  Execute,
  AdaptedWallet,
  TransactionStepItem,
  SignatureStepItem,
} from '../types/index.js'
import { pollUntilHasData, pollUntilOk } from './pollApi.js'
import type { Address } from 'viem'
import { createPublicClient, fallback, http } from 'viem'
import { axios } from '../utils/index.js'
import type { AxiosRequestConfig } from 'axios'
import { getClient } from '../client.js'
import { LogLevel } from '../utils/logger.js'
import { sendTransactionSafely } from './transaction.js'

// /**
//  * When attempting to perform actions, such as, bridging or performing a cross chain action
//  * the user's account needs to meet certain requirements. For
//  * example, if the user attempts to bridge currency you must check if the
//  * user has enough balance, before providing the transaction to be signed by
//  * the user. This function executes all transactions and signatures, in order, to complete the
//  * action.
//  * @param chainId matching the chain to execute on
//  * @param request AxiosRequestConfig object with at least a url set
//  * @param wallet ReservoirWallet object that adheres to the ReservoirWallet interface
//  * @param setState Callback to update UI state has execution progresses
//  * @param newJson Data passed around, which contains steps and items etc
//  * @returns A promise you can await on
//  */

export async function executeSteps(
  chainId: number,
  request: AxiosRequestConfig,
  wallet: AdaptedWallet,
  setState: (steps: Execute['steps'], fees?: Execute['fees']) => any,
  newJson?: Execute,
  stepOptions?: {
    [stepId: string]: {
      gasLimit?: string
    }
  },
) {
  const client = getClient()

  if (client?.baseApiUrl) {
    request.baseURL = client.baseApiUrl
  }

  const pollingInterval = client.pollingInterval ?? 5000

  const maximumAttempts =
    client.maxPollingAttemptsBeforeTimeout ??
    (2.5 * 60 * 1000) / pollingInterval

  const chain = client.chains.find((chain) => chain.id === chainId)
  const walletChainId = await wallet.getChainId()

  if (!chain) {
    throw `Unable to find chain: Chain id ${chainId}`
  } else if (chain.id !== walletChainId) {
    throw `Current chain id: ${walletChainId} does not match expected chain id: ${chain.id} `
  }

  const viemClient = createPublicClient({
    chain: chain?.viemChain,
    transport: wallet.transport ? fallback([wallet.transport, http()]) : http(),
  })

  let json = newJson
  try {
    if (!json) {
      client.log(['Execute Steps: Fetching Steps', request], LogLevel.Verbose)
      const res = await axios.request(request)
      json = res.data as Execute
      if (res.status !== 200) throw json
      client.log(['Execute Steps: Steps retrieved', json], LogLevel.Verbose)
    }

    // Handle errors
    if (json.error || !json.steps) throw json

    // Update state on first call or recursion
    setState([...json?.steps], { ...json?.fees })

    let incompleteStepIndex = -1
    let incompleteStepItemIndex = -1
    json.steps.find((step, i) => {
      if (!step.items) {
        return false
      }

      incompleteStepItemIndex = step.items.findIndex(
        (item) => item.status == 'incomplete',
      )
      if (incompleteStepItemIndex !== -1) {
        incompleteStepIndex = i
        return true
      }
    })

    // There are no more incomplete steps
    if (incompleteStepIndex === -1) {
      client.log(['Execute Steps: all steps complete'], LogLevel.Verbose)
      return
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
        LogLevel.Verbose,
      )
      return
    }

    let { kind } = step
    let stepItem = stepItems[incompleteStepItemIndex]
    // If step item is missing data, poll until it is ready
    if (!stepItem.data) {
      client.log(
        ['Execute Steps: step item data is missing, begin polling'],
        LogLevel.Verbose,
      )
      json = (await pollUntilHasData(request, (json) => {
        client.log(
          ['Execute Steps: step item data is missing, polling', json],
          LogLevel.Verbose,
        )
        const data = json as Execute
        // An item is ready if:
        // - data became available
        // - the status changed to "completed"
        return data?.steps?.[incompleteStepIndex].items?.[
          incompleteStepItemIndex
        ].data ||
          data?.steps?.[incompleteStepIndex].items?.[incompleteStepItemIndex]
            .status === 'complete'
          ? true
          : false
      })) as Execute
      if (!json.steps || !json.steps[incompleteStepIndex].items) throw json
      const items = json.steps[incompleteStepIndex].items
      if (
        !items ||
        !items[incompleteStepItemIndex] ||
        !items[incompleteStepItemIndex].data
      ) {
        throw json
      }
      stepItems = items
      stepItem = items[incompleteStepItemIndex]
      setState([...json?.steps], { ...json?.fees })
    }
    client.log(
      [`Execute Steps: Begin processing step items for: ${step.action}`],
      LogLevel.Verbose,
    )

    const promises = stepItems
      .filter((stepItem) => stepItem.status === 'incomplete')
      .map((stepItem) => {
        return new Promise(async (resolve, reject) => {
          try {
            const stepData = stepItem.data

            if (!json) {
              return
            }
            // Handle each step based on it's kind
            switch (kind) {
              // Make an on-chain transaction
              case 'transaction': {
                try {
                  client.log(
                    [
                      'Execute Steps: Begin transaction step for, sending transaction',
                    ],
                    LogLevel.Verbose,
                  )

                  // if chainId is present in the tx data field then you should relay the tx on that chain
                  // otherwise, it's assumed the chain id matched the network the api request was made on
                  const transactionChainId = stepItem?.data?.chainId ?? chainId

                  const crossChainIntentChainId = chainId

                  await sendTransactionSafely(
                    transactionChainId,
                    viemClient,
                    stepItem as TransactionStepItem,
                    step,
                    wallet,
                    (txHashes) => {
                      client.log(
                        [
                          'Execute Steps: Transaction step, got transactions',
                          txHashes,
                        ],
                        LogLevel.Verbose,
                      )
                      stepItem.txHashes = txHashes
                      if (json) {
                        setState([...json.steps], { ...json?.fees })
                      }
                    },
                    (internalTxHashes) => {
                      stepItem.internalTxHashes = internalTxHashes
                      if (json) {
                        setState([...json.steps], { ...json?.fees })
                      }
                    },
                    request,
                    undefined,
                    crossChainIntentChainId,
                  )
                } catch (e) {
                  throw e
                }
                break
              }

              // Sign a message
              case 'signature': {
                let signature: string | undefined
                const signData = stepData['sign']
                const postData = stepData['post']
                client.log(
                  ['Execute Steps: Begin signature step'],
                  LogLevel.Verbose,
                )
                if (signData) {
                  signature = await wallet.handleSignMessageStep(
                    stepItem as SignatureStepItem,
                    step,
                  )

                  if (signature) {
                    request.params = {
                      ...request.params,
                      signature,
                    }
                  }
                }

                if (postData) {
                  client.log(['Execute Steps: Posting order'], LogLevel.Verbose)
                  const postOrderUrl = new URL(
                    `${request.baseURL}${postData.endpoint}`,
                  )
                  const headers = {
                    'Content-Type': 'application/json',
                  }

                  try {
                    const getData = async function () {
                      let response = await axios.request({
                        url: postOrderUrl.href,
                        data: postData.body
                          ? JSON.stringify(postData.body)
                          : undefined,
                        method: postData.method,
                        params: request.params,
                        headers,
                      })

                      return response
                    }

                    const res = await getData()

                    // If check, poll check until validated
                    if (stepItem?.check) {
                      await pollUntilOk(
                        {
                          url: `${request.baseURL}${stepItem?.check.endpoint}`,
                          method: stepItem?.check.method,
                          headers,
                        },
                        (res) => {
                          client.log(
                            [
                              `Execute Steps: Polling execute status to check if indexed`,
                              res,
                            ],
                            LogLevel.Verbose,
                          )
                          if (
                            res?.data?.status === 'success' &&
                            res?.data?.txHashes
                          ) {
                            const chainTxHashes: NonNullable<
                              Execute['steps'][0]['items']
                            >[0]['txHashes'] = res.data?.txHashes?.map(
                              (hash: Address) => {
                                return {
                                  txHash: hash,
                                  chainId:
                                    res.data.destinationChainId ?? chain?.id,
                                }
                              },
                            )
                            stepItem.txHashes = chainTxHashes
                            return true
                          } else if (res?.data?.status === 'failure') {
                            throw Error(
                              res?.data?.details || 'Transaction failed',
                            )
                          }
                          return false
                        },
                        maximumAttempts,
                        0,
                        pollingInterval,
                      )
                    }

                    if (res.status > 299 || res.status < 200) throw res.data

                    if (res.data.results) {
                      stepItem.orderData = res.data.results
                    } else if (res.data && res.data.orderId) {
                      stepItem.orderData = [
                        {
                          orderId: res.data.orderId,
                          crossPostingOrderId: res.data.crossPostingOrderId,
                          orderIndex: res.data.orderIndex || 0,
                        },
                      ]
                    }
                    setState([...json?.steps], { ...json?.fees })
                  } catch (err) {
                    throw err
                  }
                }

                break
              }

              default:
                break
            }

            stepItem.status = 'complete'
            setState([...json?.steps], { ...json?.fees })
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
              setState([...json?.steps], { ...json?.fees })
            }
            reject(error)
          }
        })
      })

    await Promise.all(promises)

    // Recursively call executeSteps()
    await executeSteps(chainId, request, wallet, setState, json, stepOptions)
  } catch (err: any) {
    let blockNumber = 0n
    try {
      blockNumber = await viemClient.getBlockNumber()
    } catch (blockError) {
      client.log(
        ['Execute Steps: Failed to get block number', blockError],
        LogLevel.Error,
      )
    }
    client.log(
      ['Execute Steps: An error occurred', err, 'Block Number:', blockNumber],
      LogLevel.Error,
    )

    if (json) {
      json.error = err && err?.response?.data ? err.response.data : err
      setState([...json?.steps], { ...json?.fees })
    } else {
      json = {
        error: err && err?.response?.data ? err.response.data : err,
        steps: [],
      }
    }

    throw err
  }
}
