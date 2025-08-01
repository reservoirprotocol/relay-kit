import { parseSignature } from 'viem'
import type { Execute } from '../types/Execute.js'
import axios from 'axios'
import type { RelayClient } from '../client.js'
import { LogLevel } from './logger.js'

export function prepareHyperliquidSignatureStep(
  steps: Execute['steps'],
  chainId: number
) {
  const items = steps[0]?.items
  const amount = items[0]?.data?.action?.parameters?.amount
  const destination = items[0]?.data?.action?.parameters?.destination
  const signatureStep = {
    id: 'sign' as any,
    action: 'Confirm transaction in your wallet',
    description: `Sign a message to confirm the transaction`,
    kind: 'signature' as const,
    items: [
      {
        status: 'incomplete' as 'incomplete' | 'complete',
        data: {
          sign: {
            signatureKind: 'eip712',
            domain: {
              name: 'HyperliquidSignTransaction',
              version: '1',
              chainId: chainId,
              verifyingContract: '0x0000000000000000000000000000000000000000'
            },
            types: {
              'HyperliquidTransaction:UsdSend': [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'destination', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'time', type: 'uint64' }
              ],
              EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
              ]
            },
            primaryType: 'HyperliquidTransaction:UsdSend',
            value: {
              type: 'usdSend',
              signatureChainId: `0x${chainId.toString(16)}`,
              hyperliquidChain: 'Mainnet',
              destination: destination?.toLowerCase(),
              amount,
              time: new Date().getTime()
            }
          }
        },
        check: {
          endpoint: `/intents/status?requestId=${steps[0]?.requestId}`,
          method: 'GET'
        }
      }
    ],
    requestId: steps[0]?.requestId,
    depositAddress: steps[0]?.depositAddress
  }

  return signatureStep
}

export async function sendUsd(
  client: RelayClient,
  signature: string,
  stepItem: Execute['steps'][0]['items'][0]
) {
  client.log(
    ['Execute Steps: Sending signature to Hyperliquid', signature],
    LogLevel.Verbose
  )
  const { r, s, v } = parseSignature(signature as `0x${string}`)
  const currentTime = stepItem?.data?.sign?.value?.time ?? new Date().getTime()
  const res = await axios.post('https://api.hyperliquid.xyz/exchange', {
    signature: {
      r,
      s,
      v: Number(v ?? 0n)
    },
    nonce: currentTime,
    action: {
      type: stepItem?.data?.sign?.value?.type,
      signatureChainId: `0x${stepItem?.data?.sign?.domain?.chainId?.toString(16)}`,
      hyperliquidChain: 'Mainnet',
      destination: stepItem?.data?.sign?.value?.destination?.toLowerCase(),
      amount: stepItem?.data?.sign?.value?.amount,
      time: currentTime
    }
  })
  if (
    !res ||
    !res.data ||
    (res && res.status !== 200) ||
    res.data.status != 'ok'
  ) {
    throw 'Failed to send signature to HyperLiquid'
  }
  client.log(
    ['Execute Steps: Signature sent to Hyperliquid', res.data],
    LogLevel.Verbose
  )
  return res.data
}
