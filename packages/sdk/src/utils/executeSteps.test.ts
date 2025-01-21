import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axios } from './axios'
import { createClient } from '../client'
import { executeBridge } from '../../tests/data/executeBridge'
import { executeSteps } from './executeSteps'
import { MAINNET_RELAY_API } from '../constants/servers'
import { http } from 'viem'
import { mainnet } from 'viem/chains'
import { executeBridgeAuthorize } from '../../tests/data/executeBridgeAuthorize'
import type { ChainVM, Execute } from '../types'
import { postSignatureExtraSteps } from '../../tests/data/postSignatureExtraSteps'
import { swapWithApproval } from '../../tests/data/swapWithApproval'

const waitForTransactionReceiptMock = vi.fn().mockResolvedValue({
  blobGasPrice: 100n,
  blobGasUsed: 50n,
  blockHash: '0x123456789',
  blockNumber: 123n,
  contractAddress: '0x987654321',
  cumulativeGasUsed: 500n,
  effectiveGasPrice: 200n,
  from: '0x111111111',
  gasUsed: 300n,
  logs: [],
  logsBloom: '0xabcdef',
  root: '0x987654321',
  status: 'success',
  to: '0x222222222',
  transactionHash: '0x333333333',
  transactionIndex: 1,
  type: 'eip1559'
})

const waitForTransactionReceipt = (args: any) => {
  return new Promise((resolve, reject) => {
    const receiptData = waitForTransactionReceiptMock(args)
    resolve(receiptData)
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

vi.mock('viem', async () => {
  const viem = await vi.importActual('viem')

  return {
    ...viem,
    createPublicClient: (args: any) => {
      //@ts-ignore
      const client = viem.createPublicClient(args)
      client.waitForTransactionReceipt = waitForTransactionReceipt
      client.getBlockNumber = () => {
        return new Promise((resolve) => {
          resolve(1n)
        })
      }
      return client
    }
  }
})

let bridgeData: Execute = JSON.parse(JSON.stringify(executeBridge))
let swapData: Execute = JSON.parse(JSON.stringify(swapWithApproval))

let wallet = {
  vmType: 'evm' as ChainVM,
  getChainId: () => Promise.resolve(1),
  transport: http(mainnet.rpcUrls.default.http[0]),
  address: () => Promise.resolve('0x'),
  handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
  handleSendTransactionStep: vi.fn().mockResolvedValue('0x'),
  handleConfirmTransactionStep: vi.fn().mockResolvedValue('0x'),
  switchChain: vi.fn().mockResolvedValue('0x'),
  supportsAtomicBatch: vi.fn().mockResolvedValue(false),
  handleBatchTransactionStep: vi.fn().mockResolvedValue('0x')
}

let client = createClient({
  baseApiUrl: MAINNET_RELAY_API
})

let axiosRequestSpy: ReturnType<typeof mockAxiosRequest>
let axiosPostSpy: ReturnType<typeof mockAxiosPost>

const mockAxiosRequest = () => {
  return vi.spyOn(axios, 'request').mockImplementation((config) => {
    if (config.url?.includes('/intents/status')) {
      return Promise.resolve({
        data: { status: 'success', txHashes: ['0x'] },
        status: 200
      })
    }
    if (
      config.url?.includes('transactions/index') ||
      config.url?.includes('/execute/permits')
    ) {
      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    }
    return Promise.reject(new Error('Unexpected URL'))
  })
}

const mockAxiosPost = () => {
  return vi.spyOn(axios, 'post').mockImplementation((url, data, config) => {
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
}

describe('Should test the executeSteps method.', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    axiosRequestSpy = mockAxiosRequest()
    axiosPostSpy = mockAxiosPost()
    bridgeData = JSON.parse(JSON.stringify(executeBridge))
    swapData = JSON.parse(JSON.stringify(swapWithApproval))
    wallet = {
      vmType: 'evm',
      getChainId: () => Promise.resolve(1),
      transport: http(mainnet.rpcUrls.default.http[0]),
      address: () => Promise.resolve('0x'),
      handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
      handleSendTransactionStep: vi.fn().mockResolvedValue('0x'),
      handleConfirmTransactionStep: vi.fn().mockResolvedValue('0x'),
      switchChain: vi.fn().mockResolvedValue('0x'),
      supportsAtomicBatch: vi.fn().mockResolvedValue(false),
      handleBatchTransactionStep: vi.fn().mockResolvedValue('0x')
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
    await executeSteps(
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

  it('Should throw: Transaction hash not returned from handleSendTransactionStep method', async () => {
    wallet.handleSendTransactionStep = vi.fn().mockResolvedValue(null)

    await expect(
      executeSteps(1, {}, wallet, ({ steps }) => {}, bridgeData, undefined)
    ).rejects.toThrow(
      'Transaction hash not returned from handleSendTransactionStep method'
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
      .mockImplementationOnce((config) => {
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
      bridgeData,
      undefined
    )

    expect(axiosRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('transactions/index')
      })
    )

    expect(wallet.handleSendTransactionStep).toHaveBeenCalled()
  })

  it('Should handle step with id of "approve" by waiting on receipt before polling for confirmation', async () => {
    const axiosRequestSpy = vi.spyOn(axios, 'request')

    await executeSteps(
      1,
      {},
      wallet,
      ({ steps, fees, breakdown, details }) => {},
      swapData,
      undefined
    )

    const waitForTransactionReceiptCallIndex =
      wallet.handleConfirmTransactionStep.mock.invocationCallOrder[0]
    const pollForConfirmationCallIndices = axiosRequestSpy.mock.calls
      .filter((call) => call[0].url?.includes('/intents/status'))
      .map((call, index) => axiosRequestSpy.mock.invocationCallOrder[index])

    expect(waitForTransactionReceiptCallIndex).toBeLessThan(
      Math.min(...pollForConfirmationCallIndices)
    )
    expect(wallet.handleConfirmTransactionStep).toHaveBeenCalledTimes(2)
  })

  it('Should await tx and poll in series', async () => {
    const axiosRequestSpy = vi
      .spyOn(axios, 'request')
      .mockImplementation(async (config) => {
        await delay(100)
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
      bridgeData,
      undefined
    )

    const waitForTransactionReceiptCallIndex =
      wallet.handleConfirmTransactionStep.mock.invocationCallOrder[0]
    const pollForConfirmationCallIndices = axiosRequestSpy.mock.calls
      .filter((call) => call[0].url?.includes('/intents/status'))
      .map((call, index) => axiosRequestSpy.mock.invocationCallOrder[index])

    expect(Math.min(...pollForConfirmationCallIndices)).toBeLessThan(
      waitForTransactionReceiptCallIndex
    )
  })
})

describe('Should test a signature step.', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    vi.restoreAllMocks()
    axiosRequestSpy = mockAxiosRequest()
    axiosPostSpy = mockAxiosPost()
    bridgeData = JSON.parse(JSON.stringify(executeBridgeAuthorize))
    wallet = {
      vmType: 'evm' as ChainVM,
      getChainId: () => Promise.resolve(1),
      transport: http(mainnet.rpcUrls.default.http[0]),
      address: () => Promise.resolve('0x'),
      handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
      handleSendTransactionStep: vi.fn().mockResolvedValue('0x'),
      handleConfirmTransactionStep: vi.fn().mockResolvedValue('0x'),
      switchChain: vi.fn().mockResolvedValue('0x'),
      supportsAtomicBatch: vi.fn().mockResolvedValue(false),
      handleBatchTransactionStep: vi.fn().mockResolvedValue('0x')
    }
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })
  })

  it("Detect progressState moved to 'signing'", async () => {
    wallet.handleSignMessageStep = vi.fn().mockImplementation(() => {
      return new Promise((resolve, reject) => {})
    })
    let signingStep: Execute['steps']['0'] | undefined
    executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        signingStep = steps.find((step) =>
          step.items?.find(
            (item) =>
              item.status == 'incomplete' && item.progressState == 'signing'
          )
        )
      },
      bridgeData,
      undefined
    )
    await vi.waitFor(
      () => {
        if (!signingStep) {
          throw 'Waiting on signingStep'
        }
      },
      {
        timeout: 5000,
        interval: 100
      }
    )
    expect(signingStep?.items?.[0].progressState).toBe('signing')
  })
  it('Detects that handleSignMessageStep was called', async () => {
    wallet.handleSignMessageStep = vi.fn().mockImplementation((args) => {
      return new Promise((resolve, reject) => {})
    })
    executeSteps(1, {}, wallet, () => {}, bridgeData, undefined)
    await vi.waitFor(
      () => {
        if (!wallet.handleSignMessageStep.mock.calls.length) {
          throw 'Waiting for handleSignMessageStep to be called'
        }
      },
      {
        timeout: 5000,
        interval: 100
      }
    )

    const step = bridgeData.steps.find((step) =>
      step.items?.find((item) => item.status === 'incomplete')
    )

    expect(wallet.handleSignMessageStep).toBeCalledWith(step?.items?.[0], step)
  })
  it('Handle wallet chain, function chain mismatch', async () => {
    await expect(
      executeSteps(10, {}, wallet, () => {}, bridgeData, undefined)
    ).rejects.toThrow(
      'Current chain id: 1 does not match expected chain id: 10'
    )
  })
  it('Should post a signature', async () => {
    const signatureStep = bridgeData.steps.find(
      (step) => step.kind === 'signature'
    )
    const signatureStepItem: NonNullable<Execute['steps']['0']['items']>['0'] =
      signatureStep?.items?.[0] as any
    const endpoint = signatureStepItem.data.post.endpoint
    const body = signatureStepItem.data.post.body

    let progressStateSetToPosting = false

    executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        const signatureStep = steps.find((step) => step.kind === 'signature')
        const signatureStepItem = signatureStep?.items?.[0]
        if (signatureStepItem?.progressState === 'posting') {
          progressStateSetToPosting = true
        }
      },
      bridgeData,
      undefined
    )

    await vi.waitFor(() => {
      const postingDataRequest = axiosRequestSpy.mock.calls.find((call) =>
        call[0].url?.includes(endpoint)
      )
      if (!postingDataRequest || !progressStateSetToPosting) {
        throw 'Waiting for signature post request'
      }
    })

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(endpoint),
        data: expect.stringMatching(JSON.stringify(body))
      })
    )
    expect(progressStateSetToPosting).toBeTruthy()
  })
  it('Should append new steps returned in posted response', async () => {
    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url?.includes('/execute/permits')) {
        return Promise.resolve({
          data: { status: 'success', steps: postSignatureExtraSteps },
          status: 200
        })
      }

      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })
    let progressSteps: Execute['steps']
    let extraStep: Execute['steps'][0] | undefined
    executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        progressSteps = steps
      },
      bridgeData,
      undefined
    )

    await vi.waitFor(
      () => {
        extraStep = progressSteps.find(
          (step) => step.action === postSignatureExtraSteps[0].action
        )
        if (!extraStep) {
          throw 'Waiting for extra step to be appended'
        }
      },
      { interval: 100, timeout: 5000 }
    )

    expect(extraStep?.action).toBe(postSignatureExtraSteps[0].action)
  })
  it('Should append orderData returned in posted response', async () => {
    const results = [
      {
        crossPostingOrderId: '0xabc',
        orderId: '0x123',
        orderIndex: 1
      }
    ]
    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url?.includes('/execute/permits')) {
        return Promise.resolve({
          data: { status: 'success', results },
          status: 200
        })
      }
      if (config.url?.includes('/intents/status')) {
        return Promise.resolve({
          data: { status: 'success', txHashes: ['0x'] },
          status: 200
        })
      }

      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })
    let signatureStepItemOrderData:
      | NonNullable<Execute['steps']['0']['items']>['0']['orderData']
      | undefined
    await executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        if (!signatureStepItemOrderData) {
          signatureStepItemOrderData = steps.find(
            (step) => step.kind === 'signature'
          )?.items?.[0].orderData
        }
      },
      bridgeData,
      undefined
    )

    await vi.waitFor(() => {
      if (!signatureStepItemOrderData) {
        throw 'Waiting for orderData'
      }
      return true
    })

    expect(signatureStepItemOrderData).toStrictEqual(results)
  })
  it('Should append orderData returned in posted response', async () => {
    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url?.includes('/execute/permits')) {
        return Promise.resolve({
          data: {
            status: 'success',
            orderId: '0x123',
            crossPostingOrderId: '0xabc',
            orderIndex: 1
          },
          status: 200
        })
      }
      if (config.url?.includes('/intents/status')) {
        return Promise.resolve({
          data: { status: 'success', txHashes: ['0x'] },
          status: 200
        })
      }

      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })
    let signatureStepItemOrderData:
      | NonNullable<Execute['steps']['0']['items']>['0']['orderData']
      | undefined
    await executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        if (!signatureStepItemOrderData) {
          signatureStepItemOrderData = steps.find(
            (step) => step.kind === 'signature'
          )?.items?.[0].orderData
        }
      },
      bridgeData,
      undefined
    )

    await vi.waitFor(() => {
      if (!signatureStepItemOrderData) {
        throw 'Waiting for orderData'
      }
      return true
    })

    expect(signatureStepItemOrderData).toStrictEqual([
      {
        orderId: '0x123',
        crossPostingOrderId: '0xabc',
        orderIndex: 1
      }
    ])
  })
  it('Should validate a signature step item', async () => {
    let progressState = ''
    let isValidating = false

    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url?.includes('/intents/status')) {
        return Promise.resolve({
          data: { status: 'pending' },
          status: 200
        })
      }
      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })

    executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        const signatureStep = steps.find((step) => step.kind === 'signature')
        const signatureStepItem = signatureStep?.items?.[0]
        progressState = signatureStepItem?.progressState ?? ''
        isValidating = signatureStepItem?.isValidatingSignature ? true : false
      },
      bridgeData,
      undefined
    )

    await vi.waitFor(() => {
      if (progressState !== 'validating' || !isValidating) {
        throw 'Waiting for signature validation'
      }
    })
    expect(progressState).toBe('validating')
    expect(isValidating).toBeTruthy()
  })
  it('Should set txHashes returned by check request', async () => {
    let signatureStep = bridgeData.steps.find(
      (step) => step.kind === 'signature'
    )
    let signatureStepItem: NonNullable<Execute['steps']['0']['items']>['0'] =
      signatureStep?.items?.[0] as any
    const checkEndpoint = signatureStepItem.check?.endpoint ?? ''
    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url?.includes(checkEndpoint)) {
        return Promise.resolve({
          data: {
            status: 'success',
            txHashes: ['0x123'],
            destinationChainId: 10,
            originChainId: 1,
            inTxHashes: ['0xabc']
          },
          status: 200
        })
      }

      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })
    let progressSteps: Execute['steps'] | undefined

    executeSteps(
      1,
      {},
      wallet,
      ({ steps }) => {
        progressSteps = steps
      },
      bridgeData,
      undefined
    )

    await vi.waitFor(() => {
      const signatureStep = progressSteps?.find(
        (step) => step.kind === 'signature'
      )
      const stepItem = signatureStep?.items?.[0]

      if (!stepItem?.txHashes?.length || !stepItem?.internalTxHashes?.length) {
        throw 'Waiting to txHashes to be set'
      }
    })
    signatureStep = progressSteps?.find((step) => step.kind === 'signature')
    signatureStepItem = signatureStep?.items?.[0] as any
    expect(signatureStepItem.txHashes).toStrictEqual(
      expect.arrayContaining([{ txHash: '0x123', chainId: 10 }])
    )
    expect(signatureStepItem.internalTxHashes).toStrictEqual(
      expect.arrayContaining([{ txHash: '0xabc', chainId: 1 }])
    )
  })
  it('Should throw an error if check fails', async () => {
    let signatureStep = bridgeData.steps.find(
      (step) => step.kind === 'signature'
    )
    let signatureStepItem: NonNullable<Execute['steps']['0']['items']>['0'] =
      signatureStep?.items?.[0] as any
    const checkEndpoint = signatureStepItem.check?.endpoint ?? ''
    let errorMessage: string | undefined
    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url?.includes(checkEndpoint)) {
        return Promise.resolve({
          data: { status: 'failure', details: 'Failed to check' },
          status: 400
        })
      }

      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })
    executeSteps(1, {}, wallet, () => {}, bridgeData, undefined).catch((e) => {
      errorMessage = e.message ?? ''
    })

    await vi.waitFor(() => {
      if (!errorMessage) {
        throw 'Waiting for check to error'
      }
    })
    expect(errorMessage).toBe('Failed to check')
  })
  it('Should mark the signature as complete when complete', async () => {
    const { steps } = await executeSteps(
      1,
      {},
      wallet,
      () => {},
      bridgeData,
      undefined
    )
    const signatureStep = steps.find((item) => item.kind === 'signature')
    const allComplete = signatureStep?.items?.every(
      (item) => item.status === 'complete' && item.progressState === 'complete'
    )
    const isValidatingSignatureDisabled = signatureStep?.items?.every(
      (item) => !item.isValidatingSignature
    )
    expect(allComplete).toBeTruthy()
    expect(
      signatureStep && signatureStep.items ? signatureStep.items.length : 0
    ).toBeGreaterThan(0)
    expect(isValidatingSignatureDisabled).toBeTruthy()
  })
})

describe('Base tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    axiosRequestSpy = mockAxiosRequest()
    axiosPostSpy = mockAxiosPost()
    bridgeData = JSON.parse(JSON.stringify(executeBridge))
    swapData = JSON.parse(JSON.stringify(swapWithApproval))
    wallet = {
      vmType: 'evm',
      getChainId: () => Promise.resolve(1),
      transport: http(mainnet.rpcUrls.default.http[0]),
      address: () => Promise.resolve('0x'),
      handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
      handleSendTransactionStep: vi.fn().mockResolvedValue('0x'),
      handleConfirmTransactionStep: vi.fn().mockResolvedValue('0x'),
      switchChain: vi.fn().mockResolvedValue('0x'),
      supportsAtomicBatch: vi.fn().mockResolvedValue(false),
      handleBatchTransactionStep: vi.fn().mockResolvedValue('0x')
    }
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })
  })

  it('Should throw an error when supplied chain is not configured', async () => {
    let errorMessage: string | undefined
    executeSteps(1337, {}, wallet, () => {}, bridgeData, undefined).catch(
      (e) => {
        errorMessage = e
      }
    )
    await vi.waitFor(() => {
      if (!errorMessage) {
        throw 'Waiting for error message'
      }
    })
    expect(errorMessage).toBe('Unable to find chain: Chain id 1337')
  })
  it('Should fetch json if missing and fail if error returned', async () => {
    let fetchedJson = false
    let errorMessage: string | undefined
    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url === 'https://api.relay.link/get/quote') {
        fetchedJson = true
        return Promise.resolve({
          data: { status: 'failure', details: 'Failed to check' },
          status: 400
        })
      }

      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })
    executeSteps(
      1,
      {
        method: 'GET',
        url: 'https://api.relay.link/get/quote'
      },
      wallet,
      () => {},
      undefined,
      undefined
    ).catch((e) => {
      errorMessage = e
    })

    await vi.waitFor(() => {
      if (!errorMessage) {
        throw 'Waiting for error message'
      }
    })

    expect(errorMessage).toBeDefined()
    expect(fetchedJson).toBeTruthy()
  })
  it('Should throw an error when steps are missing', async () => {
    let errorMessage: string | undefined
    executeSteps(1, {}, wallet, () => {}, {} as any, undefined).catch((e) => {
      errorMessage = e
    })

    await vi.waitFor(() => {
      if (!errorMessage) {
        throw 'Waiting for error message'
      }
    })
    expect(errorMessage).toBeDefined()
  })
  it('Should poll if step item data is missing', async () => {
    let fetchedStepItem = false
    vi.spyOn(axios, 'request').mockImplementation((config) => {
      if (config.url === 'https://api.relay.link/get/quote') {
        fetchedStepItem = true
        return Promise.resolve({
          ...bridgeData,
          status: 200
        })
      }

      return Promise.resolve({
        data: { status: 'success' },
        status: 200
      })
    })
    const _bridgeData: Execute = JSON.parse(JSON.stringify(bridgeData))
    _bridgeData.steps.forEach((step) => {
      step.items?.forEach((item) => {
        delete item.data
      })
    })
    executeSteps(
      1,
      {
        url: 'https://api.relay.link/get/quote',
        method: 'GET'
      },
      wallet,
      () => {},
      _bridgeData,
      undefined
    )

    await vi.waitFor(() => {
      if (!fetchedStepItem) {
        throw 'Waiting to fetch step item'
      }
    })
    expect(fetchedStepItem).toBeTruthy()
  })

  it('Should return the final results in the execute response', async () => {
    const result = await executeSteps(
      1,
      {
        url: 'https://api.relay.link/get/quote',
        method: 'GET'
      },
      wallet,
      () => {},
      bridgeData,
      undefined
    )

    await vi.waitFor(() => {
      if (!result) {
        throw 'Waiting for the result'
      }
    })
    expect(result).toBeDefined()
    expect(
      result.steps.every((step) =>
        step.items?.every((item) => item.status === 'complete')
      )
    ).toBeTruthy()
  })
})

describe('Should test atomic batch transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    axiosRequestSpy = mockAxiosRequest()
    axiosPostSpy = mockAxiosPost()
    swapData = JSON.parse(JSON.stringify(swapWithApproval))
    wallet = {
      vmType: 'evm',
      getChainId: () => Promise.resolve(1),
      transport: http(mainnet.rpcUrls.default.http[0]),
      address: () => Promise.resolve('0x'),
      handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
      handleSendTransactionStep: vi.fn().mockResolvedValue('0x'),
      handleConfirmTransactionStep: vi.fn().mockResolvedValue('0x'),
      switchChain: vi.fn().mockResolvedValue('0x'),
      supportsAtomicBatch: vi.fn().mockResolvedValue(true),
      handleBatchTransactionStep: vi.fn().mockResolvedValue('0x')
    }
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })
  })

  it('Should use handleBatchTransactionStep when atomic batching is supported', async () => {
    let batchedSteps: Execute['steps'] | undefined
    await executeSteps(
      1,
      {},
      wallet,
      ({ steps, fees, breakdown, details }) => {
        batchedSteps = steps
      },
      swapData,
      undefined
    )

    // Should call handleBatchTransactionStep once for both approve and swap
    expect(wallet.handleBatchTransactionStep).toHaveBeenCalledTimes(1)
    expect(wallet.handleSendTransactionStep).not.toHaveBeenCalled()

    // Verify the steps were combined into a single batched step
    expect(batchedSteps?.[0].id).toBe('approve-and-swap')
    expect(batchedSteps?.[0].items?.length).toBe(2)
  })

  it('Should use handleSendTransactionStep when atomic batching is not supported', async () => {
    wallet.supportsAtomicBatch = vi.fn().mockResolvedValue(false)

    await executeSteps(
      1,
      {},
      wallet,
      ({ steps, fees, breakdown, details }) => {},
      swapData,
      undefined
    )

    // Should call handleSendTransactionStep twice - once for approve and once for swap
    expect(wallet.handleBatchTransactionStep).not.toHaveBeenCalled()
    expect(wallet.handleSendTransactionStep).toHaveBeenCalledTimes(2)
  })
})
