import type {
  Execute,
  SignatureStepItem,
  AdaptedWallet,
  RelayChain
} from '../../types/index.js'
import { pollUntilOk } from '../pollApi.js'
import { axios } from '../index.js'
import type { AxiosRequestConfig } from 'axios'
import { LogLevel } from '../logger.js'
import type { RelayClient } from '../../client.js'
import type { SetStateData } from './index.js'

/**
 * Handles the execution of a signature step item, including signing, posting, and validation.
 */
export async function handleSignatureStepItem({
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
}: {
  stepItem: SignatureStepItem
  step: Execute['steps'][0]
  wallet: AdaptedWallet
  setState: (data: SetStateData) => any
  request: AxiosRequestConfig
  client: RelayClient
  json: Execute
  maximumAttempts: number
  pollingInterval: number
  chain: RelayChain
}): Promise<void> {
  if (!stepItem.data) {
    throw `Step item is missing data`
  }

  let signature: string | undefined
  const signData = stepItem.data['sign']
  const postData = stepItem.data['post']

  client.log(['Execute Steps: Begin signature step'], LogLevel.Verbose)

  if (signData) {
    stepItem.progressState = 'signing'
    setState({
      steps: [...json.steps],
      fees: { ...json?.fees },
      breakdown: json?.breakdown,
      details: json?.details
    })
    signature = await wallet.handleSignMessageStep(stepItem, step)

    if (signature) {
      request.params = {
        ...request.params,
        signature
      }
    }
  }

  if (postData) {
    client.log(['Execute Steps: Posting order'], LogLevel.Verbose)
    stepItem.progressState = 'posting'
    setState({
      steps: [...json.steps],
      fees: { ...json?.fees },
      breakdown: json?.breakdown,
      details: json?.details
    })
    const postOrderUrl = new URL(`${request.baseURL}${postData.endpoint}`)
    const headers = {
      'Content-Type': 'application/json'
    }

    if (postData.body && !postData.body.referrer) {
      postData.body.referrer = client.source
    }

    try {
      const getData = async function () {
        let response = await axios.request({
          url: postOrderUrl.href,
          data: postData.body ? JSON.stringify(postData.body) : undefined,
          method: postData.method,
          params: request.params,
          headers
        })

        return response
      }

      const res = await getData()

      // Append new steps if returned in response
      if (res.data && res.data.steps && Array.isArray(res.data.steps)) {
        json.steps = [...json.steps, ...res.data.steps]
        setState({
          steps: [...json.steps, ...res.data.steps],
          fees: { ...json.fees },
          breakdown: json.breakdown,
          details: json.details
        })
        client.log(
          [
            `Execute Steps: New steps appended from ${postData.endpoint}`,
            res.data.steps
          ],
          LogLevel.Verbose
        )
        return
      }

      // If check, poll check until validated
      if (stepItem?.check) {
        stepItem.progressState = 'validating'
        setState({
          steps: [...json.steps],
          fees: { ...json?.fees },
          breakdown: json?.breakdown,
          details: json?.details
        })(stepItem).isValidatingSignature = true
        setState({
          steps: [...json?.steps],
          fees: { ...json?.fees },
          breakdown: json?.breakdown,
          details: json?.details
        })

        await pollUntilOk(
          {
            url: `${request.baseURL}${stepItem?.check?.endpoint}`,
            method: stepItem?.check?.method,
            headers
          },
          (res) => {
            client.log(
              [
                `Execute Steps: Polling execute status to check if indexed`,
                res
              ],
              LogLevel.Verbose
            )

            //set status
            if (res?.data?.status === 'success' && res?.data?.txHashes) {
              const chainTxHashes: NonNullable<
                Execute['steps'][0]['items']
              >[0]['txHashes'] = res.data?.txHashes?.map((hash: string) => {
                return {
                  txHash: hash,
                  chainId: res.data.destinationChainId ?? chain?.id
                }
              })

              if (res?.data?.inTxHashes) {
                const chainInTxHashes: NonNullable<
                  Execute['steps'][0]['items']
                >[0]['txHashes'] = res.data.inTxHashes.map((hash: string) => {
                  return {
                    txHash: hash,
                    chainId: chain?.id ?? res.data.originChainId
                  }
                })
                stepItem.internalTxHashes = chainInTxHashes
              }
              stepItem.txHashes = chainTxHashes

              return true
            } else if (res?.data?.status === 'failure') {
              throw Error(res?.data?.details || 'Transaction failed')
            } else if (res?.data?.status === 'delayed') {
              stepItem.progressState = 'validating_delayed'
            }
            return false
          },
          maximumAttempts,
          0,
          pollingInterval
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
            orderIndex: res.data.orderIndex || 0
          }
        ]
      }
      setState({
        steps: [...json?.steps],
        fees: { ...json?.fees },
        breakdown: json?.breakdown,
        details: json?.details
      })
    } catch (err) {
      throw err
    }
  }
}
