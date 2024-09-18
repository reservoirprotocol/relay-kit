import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RelayClient, createClient } from '../client'
import { MAINNET_RELAY_API } from '../constants'
import { axios } from '../utils'

let client: RelayClient | undefined

let axiosRequestSpy: ReturnType<typeof mockAxiosRequest>

const mockAxiosRequest = () => {
  return vi.spyOn(axios, 'request').mockImplementation((config) => {
    return Promise.resolve({
      data: { status: 'success' },
      status: 200
    })
  })
}

describe('Should test the getPrice action.', () => {
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
      client?.actions?.getPrice({
        destinationChainId: 1,
        originChainId: 8453,
        originCurrency: '0x0000000000000000000000000000000000000000',
        destinationCurrency: '0x0000000000000000000000000000000000000000',
        tradeType: 'EXACT_INPUT',
        amount: '1000000000000000' // 0.001 ETH
      })
    ).rejects.toThrow('RelayClient missing api url configuration')
  })

  //TODO add a test for simulate contract txs

  it('Should allow passing in additional txs', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    await client?.actions?.getPrice({
      destinationChainId: 1,
      originChainId: 8453,
      originCurrency: '0x0000000000000000000000000000000000000000',
      destinationCurrency: '0x0000000000000000000000000000000000000000',
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
        url: expect.stringContaining('price'),
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
