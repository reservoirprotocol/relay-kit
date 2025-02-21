import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import { RelayClient, createClient } from '../client'
import { http, zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { MAINNET_RELAY_API } from '../constants'
import { executeBridge } from '../../tests/data/executeBridge'
import type { AdaptedWallet, Execute } from '../types'

let client: RelayClient | undefined
let wallet: AdaptedWallet = {
  getChainId: () => Promise.resolve(1),
  transport: http(mainnet.rpcUrls.default.http[0]),
  address: () => Promise.resolve(zeroAddress),
  handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
  handleSendTransactionStep: vi.fn().mockResolvedValue('0x'),
  handleConfirmTransactionStep: vi.fn().mockResolvedValue('0x'),
  switchChain: vi.fn().mockResolvedValue(undefined),
  vmType: 'evm'
}
let quote = executeBridge
let executeStepsSpy = vi
  .fn()
  .mockImplementation(
    (
      chainId: any,
      request: any,
      wallet: any,
      progress: any,
      quote: Execute
    ) => {
      return new Promise(() => {
        delete quote.details?.currencyIn
      })
    }
  )
vi.mock('../utils/executeSteps.js', () => {
  return {
    executeSteps: (...args: any) => {
      executeStepsSpy(args)
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
})
