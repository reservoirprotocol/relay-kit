import { type Execute, RelayClient } from '@reservoir0x/relay-sdk'
import { type RelayTransaction } from '../types/index.js'
import { relativeTime } from './time.js'

export const extractFromChain = (
  transaction?: RelayTransaction | null,
  client?: RelayClient | null
) => {
  const chainId = transaction?.data?.inTxs?.[0]?.chainId
  return client?.chains.find((chain) => chain.id === chainId)
}

export const extractToChain = (
  transaction?: RelayTransaction | null,
  client?: RelayClient | null
) => {
  const chainId = transaction?.data?.outTxs?.[0]?.chainId
  return client?.chains.find((chain) => chain.id === chainId)
}

export const calculateFillTime = (transaction?: RelayTransaction | null) => {
  let fillTime = '-'
  let seconds = 0
  if (
    transaction?.status !== 'pending' &&
    transaction?.status !== 'waiting' &&
    transaction?.status !== 'delayed'
  ) {
    const inTxTimestamps =
      transaction?.data?.inTxs?.map((tx) => tx.timestamp as number) ?? null
    const txStartTimestamp = inTxTimestamps ? Math.min(...inTxTimestamps) : null
    const outTxTimestamps =
      transaction?.data?.outTxs
        ?.filter((tx) => tx.timestamp)
        ?.map((tx) => tx.timestamp as number) ?? null

    const txEndTimestamp =
      outTxTimestamps && outTxTimestamps.length > 0
        ? Math.max(...outTxTimestamps)
        : null

    if (txStartTimestamp && txEndTimestamp) {
      seconds = txEndTimestamp - txStartTimestamp
      if (seconds > 60) {
        fillTime = `${relativeTime(
          txEndTimestamp * 1000,
          txStartTimestamp * 1000,
          true
        )}`
      } else {
        fillTime = `${seconds}s`
      }
    }
  }
  return { fillTime, seconds }
}

export const calculateExecutionTime = (
  startTime: number,
  transaction?: RelayTransaction | null
) => {
  let fillTime = '-'
  let seconds = 0
  if (
    transaction?.status !== 'pending' &&
    transaction?.status !== 'waiting' &&
    transaction?.status !== 'delayed'
  ) {
    const inTxTimestamps =
      transaction?.data?.inTxs?.map((tx) => tx.timestamp as number) ?? null
    const outTxTimestamps =
      transaction?.data?.outTxs
        ?.filter((tx) => tx.timestamp)
        ?.map((tx) => tx.timestamp as number) ?? null

    const txEndTimestamp =
      outTxTimestamps && outTxTimestamps.length > 0
        ? Math.max(...outTxTimestamps)
        : null

    if (startTime && txEndTimestamp) {
      seconds = txEndTimestamp - startTime
      if (seconds > 60) {
        fillTime = `${relativeTime(txEndTimestamp * 1000, startTime * 1000, true)}`
      } else {
        fillTime = `${seconds}s`
      }
    } else if (!txEndTimestamp && inTxTimestamps && inTxTimestamps.length > 0) {
      fillTime = '-'
      seconds = 0
    }
  }
  return { fillTime, seconds }
}

export const extractDepositRequestId = (steps?: Execute['steps'] | null) => {
  let stepItems = steps?.find((step) => step.id === 'deposit')?.items

  if (!stepItems && steps && steps[0]) {
    stepItems = steps[0].items
  }
  if (stepItems && stepItems?.length > 0) {
    const endpoint = stepItems[0].check?.endpoint ?? ''
    const matches = endpoint.match(/requestId=([^&]*)/)
    return matches ? matches[1] : null
  }
  return null
}

export const statusToText = {
  pending: 'Pending',
  failure: 'Failure',
  received: 'Received',
  success: 'Success',
  fallback: 'Refunded'
}
