import { type AxiosRequestConfig } from 'axios'
import { axios } from '../utils/axios.js'
import { zeroAddress, type Address } from 'viem'
import prepareCallTransaction from '../utils/prepareCallTransaction.js'
import {
  isSimulateContractRequest,
  APIError,
  type SimulateContractRequest
} from '../utils/index.js'
import { getClient } from '../client.js'
import type { Execute, paths } from '../types/index.js'
import { deadAddress } from '../constants/address.js'

export type PriceBody = NonNullable<
  paths['/price']['post']['requestBody']['content']['application/json']
>
export type PriceBodyOptions = Omit<
  PriceBody,
  | 'destinationChainId'
  | 'originChainId'
  | 'originCurrency'
  | 'destinationCurrency'
  | 'amount'
  | 'recipient'
>

export type GetPriceParameters = {
  originChainId: number
  originCurrency: string
  destinationChainId: number
  destinationCurrency: string
  tradeType: PriceBodyOptions['tradeType']
  amount?: string
  user?: Address
  recipient?: Address
  options?: Omit<PriceBodyOptions, 'user' | 'source' | 'txs' | 'tradeType'>
  txs?: (NonNullable<PriceBody['txs']>[0] | SimulateContractRequest)[]
}

/**
 * Method to get the price
 * @param data - {@link GetPriceParameters}
 */
export async function getPrice(
  parameters: GetPriceParameters
): Promise<Execute> {
  const {
    destinationChainId,
    destinationCurrency,
    originChainId,
    originCurrency,
    tradeType,
    amount = '0',
    user,
    recipient,
    options,
    txs
  } = parameters

  const client = getClient()

  if (!client.baseApiUrl || !client.baseApiUrl.length) {
    throw new ReferenceError('RelayClient missing api url configuration')
  }

  let preparedTransactions: PriceBody['txs']
  if (txs && txs.length > 0) {
    preparedTransactions = txs.map((tx) => {
      if (isSimulateContractRequest(tx)) {
        return prepareCallTransaction(
          tx as Parameters<typeof prepareCallTransaction>['0']
        )
      }
      return tx
    })
  }

  const query: PriceBody = {
    user: user ?? deadAddress,
    destinationCurrency,
    destinationChainId,
    originCurrency,
    originChainId,
    amount,
    recipient: recipient ? (recipient as string) : user ?? zeroAddress,
    tradeType,
    referrer: client.source || undefined,
    txs: preparedTransactions,
    ...options
  }

  const request: AxiosRequestConfig = {
    url: `${client.baseApiUrl}/price`,
    method: 'post',
    data: query
  }

  const res = await axios.request(request)
  if (res.status !== 200) {
    throw new APIError(res?.data?.message, res.status, res.data)
  }
  return { ...res.data, request } as Execute
}
