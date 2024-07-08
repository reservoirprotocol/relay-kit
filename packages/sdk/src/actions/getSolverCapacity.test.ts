import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RelayClient, createClient, getClient } from '../client'
import { MAINNET_RELAY_API } from '../constants/servers'
import { getSolverCapacity } from './getSolverCapacity'
import { axios } from '../utils'
import { AxiosInstance } from 'axios'
import { zeroAddress } from 'viem'

let client: RelayClient | undefined

describe('Should test the getSolverCapcity action.', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
  })

  it("Should throw 'Client not initialized'.", async () => {
    client = undefined

    await expect(
      getSolverCapacity({
        originChainId: '1',
        destinationChainId: '8453'
      })
    ).rejects.toThrow('Client not initialized')
  })

  it('Should throw an unsupported currency error.', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    await expect(
      client?.actions?.getSolverCapacity({
        originChainId: '1',
        destinationChainId: '8453',
        // @ts-ignore
        currency: 'test'
      })
    ).rejects.toThrow('currency must be equal to one of the allowed values')
  })

  it('Should throw an unsupported chain error.', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    await expect(
      client?.actions?.getSolverCapacity({
        originChainId: '1',
        destinationChainId: '123456789'
      })
    ).rejects.toThrow('Internal error')
  })

  it('Fallsback to zero address when no user is provided.', async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    const axiosRequestSpy = vi
      .spyOn(axios, 'get')
      .mockImplementationOnce((config, params) => {
        return Promise.resolve({
          data: {},
          status: 200
        })
      })

    await client?.actions?.getSolverCapacity({
      originChainId: '1',
      destinationChainId: '8453'
    })

    expect(axiosRequestSpy.mock.lastCall).toEqual([
      'https://api.relay.link/config/v2',
      {
        params: {
          originChainId: '1',
          destinationChainId: '8453',
          user: zeroAddress,
          currency: undefined
        }
      }
    ])
  })

  it("Throw 'No solver capacity error' when no data is returned.", async () => {
    client = createClient({
      baseApiUrl: MAINNET_RELAY_API
    })

    const axiosRequestSpy = vi
      .spyOn(axios, 'get')
      .mockImplementationOnce((config) => {
        return Promise.resolve({
          data: undefined,
          status: 200
        })
      })

    await expect(
      getClient()?.actions?.getSolverCapacity({
        originChainId: '1',
        destinationChainId: '123456789'
      })
    ).rejects.toThrow('No solver capacity data')
  })
})
