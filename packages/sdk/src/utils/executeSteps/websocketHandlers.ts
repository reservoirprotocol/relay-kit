import type { Execute } from '../../types/index.js'
import type { RequestStatusUpdatedPayload } from '../websocket.js'
import type { SetStateData } from './index.js'
import { LogLevel } from '../logger.js'
import type { RelayClient } from '../../client.js'

interface WebSocketUpdateHandlerParams {
  data: RequestStatusUpdatedPayload
  stepItems: Execute['steps'][0]['items']
  chainId: number
  setState: (data: SetStateData) => void
  json: Execute
  client: RelayClient
  statusControl: {
    closeWebSocket?: () => void
    lastKnownStatus?: string
  }
  onTerminalError?: (error: Error) => void
}

export function handleWebSocketUpdate({
  data,
  stepItems,
  chainId,
  setState,
  json,
  client,
  statusControl,
  onTerminalError
}: WebSocketUpdateHandlerParams): void {
  statusControl.lastKnownStatus = data.status

  // Handle terminal states
  if (isTerminalStatus(data.status)) {
    client.log(
      ['WebSocket received terminal status: ', data.status],
      LogLevel.Verbose
    )
    statusControl.closeWebSocket?.()

    switch (data.status) {
      case 'success':
        handleSuccessStatus(data, stepItems, chainId, setState, json, client)
        break
      case 'failure':
        handleFailureStatus(client, onTerminalError)
        break
      case 'refund':
        handleRefundStatus(client, onTerminalError)
        break
    }
  }
}

function isTerminalStatus(status: string): boolean {
  return ['success', 'failure', 'refund'].includes(status)
}

function handleSuccessStatus(
  data: RequestStatusUpdatedPayload,
  stepItems: Execute['steps'][0]['items'],
  chainId: number,
  setState: (data: SetStateData) => void,
  json: Execute,
  client: RelayClient
): void {
  // Update txHashes if provided
  if (data.txHashes && data.txHashes.length > 0) {
    const txHashes = data.txHashes.map((hash: string) => ({
      txHash: hash,
      chainId: data.destinationChainId ?? chainId
    }))
    updateIncompleteItems(stepItems, (item) => {
      item.txHashes = txHashes
    })
  }

  // Update internalTxHashes if provided
  if (data.inTxHashes && data.inTxHashes.length > 0) {
    const internalTxHashes = data.inTxHashes.map((hash: string) => ({
      txHash: hash,
      chainId: data.originChainId ?? chainId
    }))
    updateIncompleteItems(stepItems, (item) => {
      item.internalTxHashes = internalTxHashes
    })
  }

  // Mark step items as complete
  updateIncompleteItems(stepItems, (item) => {
    item.status = 'complete'
    item.progressState = 'complete'
    item.checkStatus = 'success'
  })

  // Update state with completed steps
  setState({
    steps: [...json.steps],
    fees: { ...json?.fees },
    breakdown: json?.breakdown,
    details: json?.details
  })

  client.log(['WebSocket: Step completed successfully', data], LogLevel.Verbose)
}

function handleFailureStatus(
  client: RelayClient,
  onTerminalError?: (error: Error) => void
): void {
  client.log(['WebSocket: transaction failed'], LogLevel.Error)
  const error = new Error('Transaction failed')
  onTerminalError?.(error)
}

function handleRefundStatus(
  client: RelayClient,
  onTerminalError?: (error: Error) => void
): void {
  client.log(['WebSocket: transaction refunded'], LogLevel.Verbose)
  const error = new Error('Transaction failed: Refunded')
  onTerminalError?.(error)
}

function updateIncompleteItems(
  stepItems: Execute['steps'][0]['items'],
  updateFn: (item: any) => void
): void {
  stepItems.forEach((item) => {
    if (item.status === 'incomplete') {
      updateFn(item)
    }
  })
}
