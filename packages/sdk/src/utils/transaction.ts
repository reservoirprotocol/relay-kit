import { type Address, type TransactionReceipt } from 'viem'
import { LogLevel } from './logger.js'
import type {
  Execute,
  AdaptedWallet,
  TransactionStepItem,
  paths
} from '../types/index.js'
import { axios } from '../utils/axios.js'
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
  isValidating?: (res?: AxiosResponse<any, any>) => void
) {
  const client = getClient()
  const walletChainId = await wallet.getChainId()
  if (chainId !== walletChainId) {
    throw `Current chain id: ${walletChainId} does not match expected chain id: ${chainId} `
  }
  let receipt: TransactionReceipt | undefined
  let transactionCancelled = false
  const pollingInterval = client.pollingInterval ?? 5000
  const maximumAttempts =
    client.maxPollingAttemptsBeforeTimeout ??
    (2.5 * 60 * 1000) / pollingInterval // default to 2 minutes and 30 seconds worth of attempts
  let waitingForConfirmation = true
  let attemptCount = 0

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

  if (!txHash) {
    throw Error(
      'Transaction hash not returned from handleSendTransactionStep method'
    )
  }
  setTxHashes([{ txHash: txHash, chainId: chainId }])

  //Set up internal functions
  const validate = (res: AxiosResponse) => {
    getClient()?.log(
      ['Execute Steps: Polling for confirmation', res],
      LogLevel.Verbose
    )

    if (res.status === 200 && res.data && res.data.status === 'failure') {
      throw Error('Transaction failed')
    }
    if (res.status === 200 && res.data && res.data.status === 'fallback') {
      throw Error('Transaction failed: Refunded')
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

  const pollForConfirmation = async () => {
    isValidating?.()
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
      } else if (res) {
        if (res.data.status !== 'pending') {
          isValidating?.(res)
          attemptCount++
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval))
      }
    }

    if (attemptCount >= maximumAttempts) {
      throw new SolverStatusTimeoutError(txHash as Address, attemptCount)
    }

    if (transactionCancelled) {
      throw Error('Transaction was cancelled')
    }
    return true
  }

  const waitForTransaction = () => {
    const controller = new AbortController()
    const signal = controller.signal
    // Handle transaction replacements and cancellations
    return {
      promise: wallet
        .handleConfirmTransactionStep(
          txHash as string,
          chainId,
          (replacementTxHash) => {
            if (signal.aborted) {
              return
            }
            setTxHashes([{ txHash: replacementTxHash, chainId: chainId }])
            txHash = replacementTxHash
            attemptCount = 0 // reset attempt count
            getClient()?.log(
              ['Transaction replaced', replacementTxHash],
              LogLevel.Verbose
            )
            postTransactionToSolver({
              txHash: replacementTxHash as Address,
              chainId,
              step,
              request,
              headers
            })
          },
          () => {
            if (signal.aborted) {
              return
            }
            transactionCancelled = true
            getClient()?.log(['Transaction cancelled'], LogLevel.Verbose)
          }
        )
        .then((data) => {
          if (signal.aborted) {
            return
          }
          receipt = data
          getClient()?.log(
            ['Transaction Receipt obtained', receipt],
            LogLevel.Verbose
          )
        })
        .catch((error) => {
          if (signal.aborted) {
            return
          }
          getClient()?.log(
            ['Error in waitForTransactionReceipt', error],
            LogLevel.Error
          )
          if (error.message === 'Transaction cancelled') {
            transactionCancelled = true
          }
        }),
      controller
    }
  }

  //Sequence internal functions
  if (step.id === 'approve') {
    await waitForTransaction().promise
    await pollForConfirmation()
  } else {
    const { promise: receiptPromise, controller: receiptController } =
      waitForTransaction()
    const confirmationPromise = pollForConfirmation()

    await Promise.race([receiptPromise, confirmationPromise])

    if (waitingForConfirmation) {
      await confirmationPromise
    }

    if (!receipt) {
      if (!item.check) {
        await receiptPromise
      } else {
        receiptController.abort()
      }
    }
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
  txHash: string | undefined
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
