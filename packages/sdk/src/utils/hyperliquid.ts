import type { Execute } from '../types/Execute.js'

export function prepareHyperliquidSignatureStep(
  steps: Execute['steps'],
  chainId: number
) {
  const items = steps[0]?.items
  const type = items[0]?.data?.action?.type ?? 'usdSend'
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
                { name: 'type', type: 'string' },
                { name: 'signatureChainId', type: 'string' },
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
              type,
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
