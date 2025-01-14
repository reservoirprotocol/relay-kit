import { type Address, type TransactionReceipt } from 'viem'
import { LogLevel } from './logger.js'
import type {
  Execute,
  AdaptedWallet,
  TransactionStepItem,
  paths,
  SvmReceipt
} from '../types/index.js'
import { axios } from '../utils/axios.js'
import type {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse
} from 'axios'
import { getClient } from '../client.js'
import { SolverStatusTimeoutError } from '../errors/index.js'
import { repeatUntilOk } from '../utils/repeatUntilOk.js'

/**
 * Safe txhash.wait which handles replacements when users speed up the transaction
 * @param url an URL object
 * @returns A Promise to wait on
 */
export async function sendTransactionSafely(
  chainId: number,
  items: TransactionStepItem | TransactionStepItem[],
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
  isValidating?: (res?: AxiosResponse<any, any>) => void,
  details?: Execute['details']
) {
  const client = getClient()
  try {
    //In some cases wallets can be delayed when switching chains, causing this check to fail.
    //To work around this we check the chain id of the active wallet a few times before declaring it a failure
    await repeatUntilOk(
      async () => {
        const walletChainId = await wallet.getChainId()
        return walletChainId === chainId
      },
      10,
      undefined,
      250
    )
  } catch (e) {
    const walletChainId = await wallet.getChainId()
    throw `Current chain id: ${walletChainId} does not match expected chain id: ${chainId} `
  }
  let receipt: TransactionReceipt | SvmReceipt | undefined
  let transactionCancelled = false
  const pollingInterval = client.pollingInterval ?? 5000
  const maximumAttempts =
    client.maxPollingAttemptsBeforeTimeout ??
    (2.5 * 60 * 1000) / pollingInterval // default to 2 minutes and 30 seconds worth of attempts
  let waitingForConfirmation = true
  let attemptCount = 0

  let txHash: string | undefined

  // Check if batching txs is supported and if there are multiple items to batch
  const isBatchTransaction = Boolean(
    Array.isArray(items) &&
      items.length > 1 &&
      wallet.handleBatchTransactionStep
  )

  if (isBatchTransaction) {
    txHash = await wallet.handleBatchTransactionStep?.(
      chainId,
      items as TransactionStepItem[]
    )
  } else {
    txHash = await wallet.handleSendTransactionStep(
      chainId,
      Array.isArray(items) ? items[0] : items,
      step
    )
  }

  if ((txHash as any) === 'null') {
    throw 'User rejected the request'
  }

  // Use the check endpoint from the last item
  const check = (Array.isArray(items) ? items[items.length - 1] : items).check

  // Post transaction to solver
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
  setTxHashes([
    { txHash: txHash, chainId: chainId, isBatchTx: isBatchTransaction }
  ])

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
        setInternalTxHashes([
          { txHash: txHash, chainId: chainId, isBatchTx: isBatchTransaction }
        ])
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

  // Poll the confirmation url to confirm the transaction went through
  const pollForConfirmation = async () => {
    isValidating?.()
    while (
      waitingForConfirmation &&
      attemptCount < maximumAttempts &&
      !transactionCancelled
    ) {
      let res
      if (check?.endpoint && !request?.data?.useExternalLiquidity) {
        res = await axios.request({
          url: `${request.baseURL}${check?.endpoint}`,
          method: check?.method,
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
            ['Error in handleConfirmTransactionStep', error],
            LogLevel.Error
          )
          if (error.message === 'Transaction cancelled') {
            transactionCancelled = true
          }
        }),
      controller
    }
  }

  //If the origin chain is bitcoin, skip polling for confirmation, because the deposit will take too long
  if (chainId === 8253038) {
    return true
  }

  if (isBatchTransaction) {
    await pollForConfirmation() // Rely on the solver to confirm batch transactions
  } else if (
    //Sequence internal functions
    // We want synchronous execution in the following cases:
    // - Approval Signature step required first
    // - Bitcoin is the destination
    // - Canonical route used
    step.id === 'approve' ||
    details?.currencyOut?.currency?.chainId === 8253038 ||
    request?.data?.useExternalLiquidity
  ) {
    await waitForTransaction().promise
    //In the following cases we want to skip polling for confirmation:
    // - Bitcoin destination chain, we want to skip polling for confirmation as the block times are lengthy
    // - Canonical route, also lengthy fill time
    if (
      details?.currencyOut?.currency?.chainId !== 8253038 &&
      !request?.data?.useExternalLiquidity
    ) {
      await pollForConfirmation()
    }
  } else {
    const { promise: receiptPromise, controller: receiptController } =
      waitForTransaction()
    const confirmationPromise = pollForConfirmation()

    await Promise.race([receiptPromise, confirmationPromise])

    if (waitingForConfirmation) {
      await confirmationPromise
    }

    if (!receipt) {
      if (!check) {
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
