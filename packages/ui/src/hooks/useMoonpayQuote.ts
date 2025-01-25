import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { setParams } from '@reservoir0x/relay-sdk'

type MoonpayPaymentMethod =
  | 'credit_debit_card'
  | 'ach_bank_transfer'
  | 'paypal'
  | 'gpb_bank_transfer'
  | 'gbp_open_banking_payment'
  | 'pix_instant_payment'
  | 'sepa_bank_transfer'

type CurrencyDetails = {
  id: string
  createdAt: string
  updatedAt: string
  type: 'fiat' | 'crypto'
  name: string
  code: string
  precision: number
  minBuyAmount?: number
  maxBuyAmount?: number
  minSellAmount?: number
  maxSellAmount?: number
  isSellSupported: boolean
  addressRegex?: string
  testnetAddressRegex?: string
  supportsAddressTag?: boolean
  addressTagRegex?: string | null
  supportsTestMode?: boolean
  isSuspended?: boolean
  isSupportedInUs?: boolean
  notAllowedUSStates?: string[]
  notAllowedCountries?: string[]
  metadata?: {
    contractAddress: number
    chainId: string
    networkCode: string
  }
}

type QuoteResponse = {
  accountId: string
  baseCurrency: CurrencyDetails
  baseCurrencyCode: string
  baseCurrencyAmount: number
  quoteCurrency: CurrencyDetails
  quoteCurrencyCode: string
  quoteCurrencyAmount: number
  quoteCurrencyPrice: number
  paymentMethod: MoonpayPaymentMethod
  feeAmount: number
  extraFeePercentage: number
  extraFeeAmount: number
  networkFeeAmount: number
  networkFeeAmountNonRefundable: boolean
  totalAmount: number
  externalId: string | null
  externalCustomerId: string | null
  signature: string
  expiresIn: number
  expiresAt: string
}

export type MoonpayQuoteResponse = QuoteResponse | null

type QueryType = typeof useQuery<
  MoonpayQuoteResponse,
  DefaultError,
  MoonpayQuoteResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']
type MoonpayQuoteQueryParams = {
  baseCurrencyCode?: string
  quoteCurrencyAmount?: number
  baseCurrencyAmount?: number
  extraFeePercentage?: number
  paymentMethod?: MoonpayPaymentMethod
  areFeesIncluded?: boolean
  apiKey?: string
}

export default (
  currencyCode?: string,
  queryParams?: MoonpayQuoteQueryParams,
  queryOptions?: Partial<QueryOptions>
) => {
  const queryKey = ['useMoonpayQuote', currencyCode, queryParams]

  const response = (useQuery as QueryType)({
    queryKey: queryKey,
    queryFn: () => {
      const url = new URL(
        `https://api.moonpay.com/v3/currencies/${currencyCode}/buy_quote`
      )

      setParams(url, queryParams as MoonpayQuoteQueryParams)

      return fetch(url.href)
        .then((response) => response.json())
        .then((response) => {
          return response
        })
    },
    ...queryOptions,
    enabled:
      currencyCode !== undefined &&
      queryParams !== undefined &&
      queryOptions?.enabled
  })

  return response
}
