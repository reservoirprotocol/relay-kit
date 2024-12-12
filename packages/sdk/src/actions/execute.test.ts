import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { RelayClient, createClient } from '../client'
import { http, zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { MAINNET_RELAY_API } from '../constants'
import { executeBridge } from '../../tests/data/executeBridge'
import { Execute } from '../types'
import { AdaptedWallet } from '../types/AdaptedWallet'
import { SignatureStepItem } from '../types/SignatureStepItem'
import { TransactionStepItem } from '../types/TransactionStepItem'

let client: RelayClient | undefined
let wallet: AdaptedWallet & {
  handleSignMessageStep: Mock
  handleSendTransactionStep: Mock
  handleConfirmTransactionStep: Mock
  switchChain: Mock
} = {
  vmType: 'evm',
  getChainId: () => Promise.resolve(1),
  transport: http(mainnet.rpcUrls.default.http[0]),
  address: () => Promise.resolve(zeroAddress),
  handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
  handleSendTransactionStep: vi.fn().mockResolvedValue('0x'),
  handleConfirmTransactionStep: vi.fn().mockResolvedValue('0x'),
  switchChain: vi.fn().mockResolvedValue(undefined)
}
let quote = executeBridge
let executeStepsSpy = vi
  .fn()
  .mockImplementation(
    async (
      chainId: number,
      request: any,
      wallet: AdaptedWallet,
      progress: any,
      quote: Execute
    ) => {
      // Return mock execution result
      return {
        steps: quote.steps.map((step: any) => ({
          ...step,
          items: step.items.map((item: any) => ({
            ...item,
            status: 'complete',
            txHashes: [{ txHash: '0x1', chainId }]
          }))
        }))
      }
    }
  )
vi.mock('../utils/executeSteps.js', () => {
  return {
    executeSteps: (...args: any) => {
      const [chainId, request, wallet, progress, quote] = args
      return executeStepsSpy(chainId, request, wallet, progress, quote)
    }
  }
})

describe('Should test the execute action.', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    quote = JSON.parse(JSON.stringify(executeBridge))
  })

  it("Should throw 'RelayClient missing api url configuration'.", async () => {
    client = createClient({
      baseApiUrl: ''
    })

    await expect(
      client?.actions?.execute({
        wallet,
        quote
      })
    ).rejects.toThrow('RelayClient missing api url configuration')
  })

  it('Should require passing in a wallet', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    await expect(
      //@ts-ignore
      client?.actions?.execute({
        quote
      })
    ).rejects.toThrow('AdaptedWallet is required to execute steps')
  })

  it('Should allow passing in additional txs', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    delete quote.details?.currencyIn?.currency?.chainId

    await expect(
      //@ts-ignore
      client?.actions?.execute({
        wallet,
        quote
      })
    ).rejects.toThrow('Missing chainId from quote')
  })

  it('Should clone the quote', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })
    await expect(
      client?.actions?.execute({
        wallet,
        quote
      })
    )
    expect(quote.details?.currencyIn).toBeDefined()
  })

  it('Should pass the correct values to the executeSteps function', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })
    await expect(
      client?.actions?.execute({
        wallet,
        quote
      })
    )
    const lastCall = executeStepsSpy.mock.lastCall[0]
    expect(lastCall[0]).toBe(1)
    expect(lastCall[2]).toBe(wallet)
    expect(typeof lastCall[3]).toBe('function')
    expect(lastCall[4].details?.currencyIn?.currency?.chainId).toBe(
      quote.details?.currencyIn?.currency?.chainId
    )
    expect(lastCall[5]).toBeUndefined()
  })

  it('Should handle cross-chain bridge operations', async () => {
    const fromChainId = 1
    const toChainId = 8453
    client = createClient({ baseApiUrl: MAINNET_RELAY_API })

    wallet.getChainId = vi.fn()
      .mockResolvedValueOnce(fromChainId)
      .mockResolvedValueOnce(toChainId)

    await client?.actions?.execute({
      wallet,
      quote: {
        ...quote,
        details: {
          ...quote.details,
          currencyIn: { currency: { chainId: fromChainId } },
          currencyOut: { currency: { chainId: toChainId } }
        }
      }
    })

    expect(wallet.switchChain).toHaveBeenCalledWith(toChainId)
  })
})
