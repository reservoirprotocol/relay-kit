import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { createClient } from '../client'
import { executeBridge } from '../../tests/data/executeBridge'
import { executeSteps } from './executeSteps'
import { MAINNET_RELAY_API } from '../constants/servers'
import { http } from 'viem'
import { mainnet } from 'viem/chains'

let bridgeData = JSON.parse(JSON.stringify(executeBridge))

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let wallet = {
  getChainId: () => Promise.resolve(1),
  transport: http(mainnet.rpcUrls.default.http[0]),
  address: () => Promise.resolve('0x'),
  handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
  handleSendTransactionStep: vi.fn().mockResolvedValue('0x')
}

const client = createClient({
  baseApiUrl: MAINNET_RELAY_API
})

vi.spyOn(axios, 'request').mockImplementation((config) => {
  console.log(config)
  if (
    config.url?.includes('/intents/status') ||
    config.url?.includes('transactions/index')
  ) {
    return Promise.resolve({
      data: { status: 'success' },
      status: 200
    })
  }
  return Promise.reject(new Error('Unexpected URL'))
})

vi.spyOn(axios, 'post').mockImplementation((url, data, config) => {
  return Promise.resolve({
    data: {
      results: [
        {
          message: 'string',
          orderId: 'string',
          orderIndex: 0,
          crossPostingOrderId: 'string',
          crossPostingOrderStatus: 'string'
        }
      ]
    },
    status: 200,
    statusText: '200',
    headers: {},
    config: {},
    request: null
  })
})

describe('Should test the executeSteps method.', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    bridgeData = JSON.parse(JSON.stringify(executeBridge))
    wallet = {
      getChainId: () => Promise.resolve(1),
      transport: http(mainnet.rpcUrls.default.http[0]),
      address: () => Promise.resolve('0x'),
      handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
      handleSendTransactionStep: vi.fn().mockResolvedValue('0x')
    }
  })

  it('Should throw an unable to find chain error.', async () => {
    await expect(executeSteps(12345, {}, wallet, () => {})).rejects.toThrow(
      'Unable to find chain'
    )
  })

  it('Should throw current chain id does not match expected', async () => {
    wallet.getChainId = () => Promise.resolve(8453)

    await expect(
      executeSteps(
        8453,
        {},
        wallet,
        ({ steps, fees, breakdown, details }) => {},
        bridgeData,
        undefined
      )
    ).rejects.toThrow(
      'Current chain id: 8453 does not match expected chain id: 1'
    )
  })

  it('Should execute sendTransaction method with correct parameters.', async () => {
    const execute = await executeSteps(
      1,
      {},
      wallet,
      ({ steps, fees, breakdown, details }) => {},
      bridgeData,
      undefined
    )

    expect(wallet.handleSignMessageStep).not.toHaveBeenCalled()
    expect(wallet.handleSendTransactionStep).toHaveBeenCalled()
    expect(wallet.handleSendTransactionStep).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          from: '0x03508bB71268BBA25ECaCC8F620e01866650532c',
          to: '0xa5f565650890fba1824ee0f21ebbbf660a179934',
          data: '0x01a25f8d',
          value: '1001599368867232',
          maxFeePerGas: '19138328136',
          maxPriorityFeePerGas: '3244774195',
          chainId: 1
        })
      }),
      expect.any(Object)
    )
  })

  it('Should execute sendTransaction with a delay', async () => {
    const onProgress = vi.fn()
    // wallet.handleSignMessageStep = vi.fn().mockImplementation(async () => {
    //   await delay(1000) // Add 1-second delay
    //   return '0x'
    // })

    await executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        onProgress(steps[0]?.items?.[0].progressState)
      },
      bridgeData,
      undefined
    )

    const statusUpdates = onProgress.mock.calls.flatMap((call) => call)

    console.log('statusUpdates: ', statusUpdates)

    expect(statusUpdates).toContain('confirming')
    expect(statusUpdates).toContain('complete')
  })

  it('Should pass in gas as 100.', async () => {
    await executeSteps(
      1,
      {},
      wallet,
      ({ steps, fees, breakdown, details }) => {},
      bridgeData,
      {
        deposit: {
          gasLimit: '100'
        }
      }
    )

    expect(wallet.handleSendTransactionStep).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          from: '0x03508bB71268BBA25ECaCC8F620e01866650532c',
          to: '0xa5f565650890fba1824ee0f21ebbbf660a179934',
          data: '0x01a25f8d',
          value: '1001599368867232',
          maxFeePerGas: '19138328136',
          maxPriorityFeePerGas: '3244774195',
          gas: '100',
          chainId: 1
        })
      }),
      expect.any(Object)
    )
  })
})
