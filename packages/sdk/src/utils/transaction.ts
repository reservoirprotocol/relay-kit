import type { Address, PublicClient } from 'viem'
import { LogLevel } from './logger.js'
import type {
  Execute,
  AdaptedWallet,
  TransactionStepItem,
  paths
} from '../types/index.js'
import axios from 'axios'
import type {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse
} from 'axios'
import { getClient } from '../client.js'
import { SolverStatusTimeoutError } from '../errors/index.js'

/**
 * Safe txhash.wait which handles replacements when users speed up the transaction
 * @param url an URL object
 * @returns A Promise to wait on
 */
export async function sendTransactionSafely(
  chainId: number,
  viemClient: PublicClient,
  item: TransactionStepItem,
  step: Execute['steps'][0],
  wallet: AdaptedWallet,
  setTxHashes: (
    tx: NonNullable<Execute['steps'][0]['items']>[0]['txHashes']
  ) => void,
  setInternalTxHashes: (
    tx: NonNullable<Execute['steps'][0]['items']>[0]['internalTxHashes']
  ) => void,
  request: AxiosRequestConfig,
  headers?: AxiosRequestHeaders,
  crossChainIntentChainId?: number,
  isValidating?: () => void
) {
  const client = getClient()
  let txHash = await wallet.handleSendTransactionStep(chainId, item, step)
  if ((txHash as any) === 'null') {
    throw 'User rejected the request'
  }

  postTransactionToSolver({
    txHash,
    chainId,
    step,
    request,
    headers
  })

  const pollingInterval = client.pollingInterval ?? 5000
  const maximumAttempts =
    client.maxPollingAttemptsBeforeTimeout ??
    (2.5 * 60 * 1000) / pollingInterval // default to 2 minutes and 30 seconds worth of attempts
  let attemptCount = 0
  let waitingForConfirmation = true
  let transactionCancelled = false

  if (!txHash) {
    throw Error('Transaction hash not returned from sendTransaction method')
  }
  setTxHashes([{ txHash: txHash, chainId: chainId }])

  // Handle transaction replacements and cancellations
  const receipt = await viemClient
    .waitForTransactionReceipt({
      hash: txHash,
      onReplaced: (replacement) => {
        if (replacement.reason === 'cancelled') {
          transactionCancelled = true
          throw Error('Transaction cancelled')
        }

        setTxHashes([
          { txHash: replacement.transaction.hash, chainId: chainId }
        ])
        txHash = replacement.transaction.hash
        attemptCount = 0 // reset attempt count
        getClient()?.log(
          ['Transaction replaced', replacement],
          LogLevel.Verbose
        )
        postTransactionToSolver({
          txHash,
          chainId,
          step,
          request,
          headers
        })
      }
    })
    .catch((error) => {
      getClient()?.log(
        ['Error in waitForTransactionReceipt', error],
        LogLevel.Error
      )
    })

  const validate = (res: AxiosResponse) => {
    getClient()?.log(
      ['Execute Steps: Polling for confirmation', res],
      LogLevel.Verbose
    )
    if (res.status === 200 && res.data && res.data.status === 'failure') {
      throw Error('Transaction failed')
    }
    if (res.status === 200 && res.data && res.data.status === 'success') {
      if (txHash) {
        setInternalTxHashes([{ txHash: txHash, chainId: chainId }])
      }

      const chainTxHashes: NonNullable<
        Execute['steps'][0]['items']
      >[0]['txHashes'] = res.data?.txHashes?.map((hash: Address) => {
        return {
          txHash: hash,
          chainId: res?.data?.destinationChainId ?? crossChainIntentChainId
        }
      })
      setTxHashes(chainTxHashes)
      return true
    }
    return false
  }

  isValidating?.()
  debugger
  // Poll the confirmation url to confirm the transaction went through
  while (
    waitingForConfirmation &&
    attemptCount < maximumAttempts &&
    !transactionCancelled
  ) {
    let res
    if (item?.check?.endpoint && !request?.data?.useExternalLiquidity) {
      res = await axios.request({
        url: `${request.baseURL}${item?.check?.endpoint}`,
        method: item?.check?.method,
        headers: headers
      })
    }

    if (!res || validate(res)) {
      waitingForConfirmation = false // transaction confirmed
    } else if (
      // rely on tx confirmation if there is no check endpoint
      !item?.check?.endpoint &&
      receipt &&
      receipt.status === 'success'
    ) {
      waitingForConfirmation = false
    } else if (res) {
      if (res.data.status !== 'pending') {
        attemptCount++
      }

      await new Promise((resolve) => setTimeout(resolve, pollingInterval))
    }
  }

  if (attemptCount >= maximumAttempts) {
    throw new SolverStatusTimeoutError(txHash, attemptCount)
  }

  if (transactionCancelled) {
    throw Error('Transaction was cancelled')
  }

  return true
}

const postTransactionToSolver = async ({
  txHash,
  chainId,
  request,
  headers,
  step
}: {
  txHash: Address | undefined
  chainId: number
  step: Execute['steps'][0]
  request: AxiosRequestConfig
  headers?: AxiosRequestHeaders
}) => {
  if (step.id === 'deposit' && txHash) {
    getClient()?.log(
      ['Posting transaction to notify the solver'],
      LogLevel.Verbose
    )
    try {
      const triggerData: NonNullable<
        paths['/transactions/index']['post']['requestBody']
      >['content']['application/json'] = {
        txHash,
        chainId: chainId.toString()
      }

      axios
        .request({
          url: `${request.baseURL}/transactions/index`,
          method: 'POST',
          headers: headers,
          data: triggerData
        })
        .then(() => {
          getClient()?.log(
            ['Transaction notified to the solver'],
            LogLevel.Verbose
          )
        })
    } catch (e) {
      getClient()?.log(
        ['Failed to post transaction to solver', e],
        LogLevel.Warn
      )
    }
  }
}
