import type { Execute } from '../types/Execute.js'
import { MAINNET_RELAY_WS } from '../constants/servers.js'

export interface RequestStatusUpdatedPayload {
  status: string
  inTxHashes?: string[]
  txHashes?: string[]
  updatedAt: number
  originChainId?: number
  destinationChainId?: number
}

export type WebSocketEventPayloads = {
  'request.status.updated': RequestStatusUpdatedPayload
}

export type WebSocketEvent = keyof WebSocketEventPayloads

export interface TrackRequestStatusOptions<E extends WebSocketEvent> {
  event: E
  requestId: string
  onOpen?: () => void
  onUpdate: (data: WebSocketEventPayloads[E]) => void
  onError?: (err: any) => void
  onClose?: () => void
  isTestnet?: boolean
  enabled?: boolean
}

// @TODO: remove once requestId gets added to top level of Execute object
export const extractDepositRequestId = (steps?: Execute['steps'] | null) => {
  if (!steps?.length) return null

  // Find the first step that has a requestId
  return steps.find((step) => step.requestId)?.requestId || null
}

export function trackRequestStatus<E extends WebSocketEvent>({
  event,
  requestId,
  onOpen,
  onUpdate,
  onError,
  onClose,
  url,
  enabled = false
}: TrackRequestStatusOptions<E> & { url?: string }) {
  if (
    !enabled ||
    typeof window === 'undefined' ||
    typeof window.WebSocket === 'undefined'
  )
    return { close: () => {} }

  const socketUrl = url || MAINNET_RELAY_WS
  const socket = new WebSocket(socketUrl)

  socket.onopen = () => {
    console.log('WebSocket opening, subscribing to:', { event, requestId })
    if (onOpen) onOpen()
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        event,
        filters: { id: requestId }
      })
    )
  }

  socket.onmessage = async (eventMsg) => {
    try {
      // Handle both string and Blob data
      let data: string
      if (eventMsg.data instanceof Blob) {
        data = await eventMsg.data.text()
      } else {
        data = eventMsg.data
      }

      console.log('WebSocket raw message:', data)

      const msg = JSON.parse(data)
      console.log('WebSocket parsed message:', msg)

      // Handle different message types
      if (msg.type === 'connection') {
        console.log('WebSocket connection established')
      } else if (msg.type === 'subscribe') {
        console.log('WebSocket subscription confirmed:', msg.status)
      } else if (msg.event === event && msg.data) {
        console.log('WebSocket matched event, calling onUpdate')
        onUpdate(msg.data)
      } else if (msg.data?.event === event && msg.data?.data) {
        console.log('WebSocket matched event in data object, calling onUpdate')
        onUpdate(msg.data.data)
      } else if (msg.event && msg.data) {
        console.log('WebSocket received different event:', {
          receivedEvent: msg.event,
          expectedEvent: event,
          hasData: !!msg.data
        })
      } else if (msg.data?.event && msg.data?.data) {
        console.log('WebSocket received different event in data object:', {
          receivedEvent: msg.data.event,
          expectedEvent: event,
          hasData: !!msg.data.data
        })
      } else {
        console.log(
          'WebSocket received unknown message type:',
          msg.type || 'no type'
        )
      }
    } catch (err) {
      console.log('WebSocket message parsing error:', err)
      onError?.(err)
    }
  }

  socket.onerror = (err) => {
    onError?.(err)
  }

  socket.onclose = () => {
    onClose?.()
  }

  return {
    close: () => socket.close()
  }
}
