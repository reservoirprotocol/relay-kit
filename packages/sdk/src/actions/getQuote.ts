import { type AxiosRequestConfig } from 'axios'
import { axios } from '../utils/axios.js'
import { zeroAddress, type Address, type WalletClient } from 'viem'
import prepareCallTransaction from '../utils/prepareCallTransaction.js'
import {
  isSimulateContractRequest,
  APIError,
  adaptViemWallet,
  type SimulateContractRequest
} from '../utils/index.js'
import { isViemWalletClient } from '../utils/viemWallet.js'
import { getClient } from '../client.js'
import type { AdaptedWallet, Execute, paths } from '../types/index.js'
import { getDeadAddress } from '../constants/address.js'

export type QuoteBody = NonNullable<
  paths['/quote']['post']['requestBody']['content']['application/json']
>
export type QuoteBodyOptions = Omit<
  QuoteBody,
  | 'destinationChainId'
  | 'originChainId'
  | 'originCurrency'
  | 'destinationCurrency'
  | 'amount'
  | 'recipient'
>

export type GetQuoteParameters = {
  chainId: number
  currency: string
  toChainId: number
  toCurrency: string
  tradeType: QuoteBodyOptions['tradeType']
  wallet?: AdaptedWallet | WalletClient
  amount?: string
  recipient?: Address
  options?: Omit<QuoteBodyOptions, 'user' | 'source' | 'txs' | 'tradeType'>
  txs?: (NonNullable<QuoteBody['txs']>[0] | SimulateContractRequest)[]
}

/**
 * Method to get a quote
 * @param data - {@link GetQuoteParameters}
 */
export async function getQuote(
  parameters: GetQuoteParameters
): Promise<Execute> {
  const {
    toChainId,
    toCurrency,
    wallet,
    chainId,
    currency,
    tradeType,
    amount = '0',
    recipient,
    options,
    txs
  } = parameters

  const client = getClient()

  if (!client.baseApiUrl || !client.baseApiUrl.length) {
    throw new ReferenceError('RelayClient missing api url configuration')
  }

  let adaptedWallet: AdaptedWallet | undefined
  let caller: string | undefined
  if (wallet) {
    adaptedWallet = isViemWalletClient(wallet)
      ? adaptViemWallet(wallet as WalletClient)
      : wallet
    caller = await adaptedWallet.address()
  }

  let preparedTransactions: QuoteBody['txs']
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

  const fromChain = client.chains.find((chain) => chain.id === chainId)
  const toChain = client.chains.find((chain) => chain.id === toChainId)

  const originDeadAddress = fromChain
    ? getDeadAddress(fromChain.vmType, fromChain.id)
    : undefined
  const destinationDeadAddress = toChain
    ? getDeadAddress(toChain.vmType, toChain.id)
    : undefined

  const query: QuoteBody = {
    user: caller || originDeadAddress || zeroAddress,
    destinationCurrency: toCurrency,
    destinationChainId: toChainId,
    originCurrency: currency,
    originChainId: chainId,
    amount,
    recipient: recipient
      ? (recipient as string)
      : caller || destinationDeadAddress || zeroAddress,
    tradeType,
    referrer: client.source || undefined,
    txs: preparedTransactions,
    ...options
  }

  const request: AxiosRequestConfig = {
    url: `${client.baseApiUrl}/quote`,
    method: 'post',
    data: query
  }

  const res = await axios.request(request)
  if (res.status !== 200) {
    throw new APIError(res?.data?.message, res.status, res.data)
  }
  return { ...res.data, request } as Execute
}
