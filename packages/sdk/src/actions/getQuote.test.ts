import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RelayClient, createClient, getClient } from '../client'
import { http, zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { MAINNET_RELAY_API } from '../constants'
import { axios } from '../utils'

let client: RelayClient | undefined
let wallet = {
  getChainId: () => Promise.resolve(1),
  transport: http(mainnet.rpcUrls.default.http[0]),
  address: () => Promise.resolve(zeroAddress),
  handleSignMessageStep: vi.fn().mockResolvedValue('0x'),
  handleSendTransactionStep: vi.fn().mockResolvedValue('0x')
}

let axiosRequestSpy: ReturnType<typeof mockAxiosRequest>

const mockAxiosRequest = () => {
  return vi.spyOn(axios, 'request').mockImplementation((config) => {
    return Promise.resolve({
      data: { status: 'success' },
      status: 200
    })
  })
}

describe('Should test the getQuote action.', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    axiosRequestSpy = mockAxiosRequest()
  })

  it("Should throw 'RelayClient missing api url configuration'.", async () => {
    client = createClient({
      baseApiUrl: ''
    })

    await expect(
      client?.actions?.getQuote({
        wallet,
        toChainId: 1,
        chainId: 8453,
        currency: '0x0000000000000000000000000000000000000000',
        toCurrency: '0x0000000000000000000000000000000000000000',
        tradeType: 'EXACT_INPUT',
        amount: '1000000000000000' // 0.001 ETH
      })
    ).rejects.toThrow('RelayClient missing api url configuration')
  })

  it('Should allow not passing in a wallet', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    await client?.actions?.getQuote({
      toChainId: 1,
      chainId: 8453,
      currency: '0x0000000000000000000000000000000000000000',
      toCurrency: '0x0000000000000000000000000000000000000000',
      tradeType: 'EXACT_INPUT',
      amount: '1000000000000000' // 0.001 ETH
    })

    expect(axiosRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('quote'),
        data: expect.objectContaining({
          user: '0x000000000000000000000000000000000000dead',
          destinationCurrency: '0x0000000000000000000000000000000000000000',
          destinationChainId: 1,
          originCurrency: '0x0000000000000000000000000000000000000000',
          originChainId: 8453,
          amount: '1000000000000000',
          recipient: '0x000000000000000000000000000000000000dead',
          tradeType: 'EXACT_INPUT'
        })
      })
    )
  })

  it('Should allow passing in additional txs', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    await client?.actions?.getQuote({
      toChainId: 1,
      chainId: 8453,
      currency: '0x0000000000000000000000000000000000000000',
      toCurrency: '0x0000000000000000000000000000000000000000',
      tradeType: 'EXACT_INPUT',
      amount: '1000000000000000', // 0.001 ETH
      txs: [
        {
          data: '0x',
          value: '0',
          to: '0x'
        }
      ]
    })

    expect(axiosRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('quote'),
        data: expect.objectContaining({
          user: '0x000000000000000000000000000000000000dead',
          destinationCurrency: '0x0000000000000000000000000000000000000000',
          destinationChainId: 1,
          originCurrency: '0x0000000000000000000000000000000000000000',
          originChainId: 8453,
          amount: '1000000000000000',
          recipient: '0x000000000000000000000000000000000000dead',
          tradeType: 'EXACT_INPUT',
          txs: [{ data: '0x', value: '0', to: '0x' }]
        })
      })
    )
  })
})
