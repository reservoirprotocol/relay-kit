import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { createClient } from '../client'
import { executeBridge } from '../../tests/data/executeBridge'
import { executeSteps } from './executeSteps'
import { MAINNET_RELAY_API } from '../constants/servers'
import { http } from 'viem'
import { mainnet } from 'viem/chains'

let bridgeData = JSON.parse(JSON.stringify(executeBridge))

let wallet = {
  getChainId: () => Promise.resolve(1),
  transport: http(mainnet.rpcUrls.default.http[0]),
  address: () => Promise.resolve('0x'),
  handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
  handleSendTransactionStep: vi.fn().mockResolvedValue('0x')
}

let client = createClient({
  baseApiUrl: MAINNET_RELAY_API
})

vi.spyOn(axios, 'request').mockImplementation((config) => {
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
    vi.resetAllMocks()
    bridgeData = JSON.parse(JSON.stringify(executeBridge))
    wallet = {
      getChainId: () => Promise.resolve(1),
      transport: http(mainnet.rpcUrls.default.http[0]),
      address: () => Promise.resolve('0x'),
      handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
      handleSendTransactionStep: vi.fn().mockResolvedValue('0x')
    }
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })
  })

  it('Should throw: Unable to find chain error.', async () => {
    await expect(executeSteps(12345, {}, wallet, () => {})).rejects.toThrow(
      'Unable to find chain'
    )
  })

  it('Should throw: Current chain id does not match expected', async () => {
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

  it('Should handle onProgress states correctly', async () => {
    const onProgress = vi.fn()

    await executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        onProgress(
          steps[0]?.items?.[0].progressState,
          steps[0]?.items?.[0].txHashes,
          steps[0]?.items?.[0].internalTxHashes
        )
      },
      bridgeData,
      undefined
    )

    const statusUpdates = onProgress.mock.calls.flatMap((call) => call[0])
    const txHashes = onProgress.mock.calls.flatMap((call) => call[1])

    expect(statusUpdates).toContain('confirming')
    expect(statusUpdates).toContain('complete')

    expect(txHashes).toContainEqual({ txHash: '0x', chainId: 1 })

    // Check if the last status update is 'complete'
    expect(statusUpdates[statusUpdates.length - 1]).toBe('complete')
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

  it('Should throw: Transaction hash not returned from sendTransaction method', async () => {
    wallet.handleSendTransactionStep = vi.fn().mockResolvedValue(null)

    await expect(
      executeSteps(1, {}, wallet, ({ steps }) => {}, bridgeData, undefined)
    ).rejects.toThrow(
      'Transaction hash not returned from sendTransaction method'
    )
  })

  it('Should throw: Failed to receive a successful response', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API,
      pollingInterval: 1,
      maxPollingAttemptsBeforeTimeout: 0
    })

    await expect(
      executeSteps(
        1,
        {},
        wallet,
        ({ steps, fees, breakdown, details }) => {},
        bridgeData,
        undefined
      )
    ).rejects.toThrow(
      `Failed to receive a successful response for solver status check with hash '0x' after 0 attempt(s).`
    )
  })

  it('Should post to solver', async () => {
    await executeSteps(
      1,
      {},
      wallet,
      ({ steps, fees, breakdown, details }) => {},
      bridgeData,
      undefined
    )

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('transactions/index')
      })
    )
  })

  it('Should handle request failure to transactions/index and still process transaction', async () => {
    const axiosRequestSpy = vi
      .spyOn(axios, 'request')
      .mockImplementation((config) => {
        if (config.url?.includes('transactions/index')) {
          return Promise.resolve({
            data: { status: 'failure' },
            status: 200
          })
        }

        return Promise.resolve({
          data: { status: 'success' },
          status: 200
        })
      })

    await executeSteps(
      1,
      {},
      wallet,
      ({ steps, fees, breakdown, details }) => {},
      executeBridge,
      undefined
    )

    expect(axiosRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('transactions/index')
      })
    )

    expect(wallet.handleSendTransactionStep).toHaveBeenCalled()
  })
})
