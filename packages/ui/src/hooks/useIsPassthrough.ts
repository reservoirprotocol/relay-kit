import { useMemo } from 'react'
import type { Token } from '../types'
import useMoonPayCurrencies, {
  type MoonPayCryptoCurrency
} from './useMoonPayCurrencies.js'
import useIpAddress from './useIpAddress.js'
import useMoonPayGeolocation from './useMoonPayGeolocation.js'
import _moonPayCurrencies from '../constants/moonPayCurrencies.js'
import { bitcoin } from '../utils/bitcoin.js'
import { solana } from '../utils/solana.js'

export default function useIsPassthrough(token: Token, apiKey?: string) {
  const { data: ipAddressResponse } = useIpAddress({
    staleTime: Infinity,
    gcTime: Infinity
  })
  const { data: geolocationResponse } = useMoonPayGeolocation(
    {
      apiKey,
      ipAddress: ipAddressResponse?.ip
    },
    {
      staleTime: Infinity,
      gcTime: Infinity
    }
  )
  const { data: moonPayCurrencies } = useMoonPayCurrencies(
    { apiKey },
    {
      staleTime: 1000 * 60 * 60 * 24, //1 day
      retryDelay: 1000 * 60 * 60 * 10 //10 minutes
    }
  )

  return useMemo(() => {
    let supportedCurrencies = _moonPayCurrencies

    if (moonPayCurrencies) {
      supportedCurrencies = moonPayCurrencies
        .filter(
          (currency) =>
            (currency.type === 'crypto' &&
              currency.metadata.chainId &&
              currency.metadata.contractAddress) ||
            currency.code === 'btc' ||
            currency.code.includes('sol')
        )
        .map((currency) => {
          currency = currency as MoonPayCryptoCurrency
          let chainId = currency.metadata.chainId
          let contractAddress = currency.metadata.contractAddress
          if (currency.code === 'btc') {
            chainId = `${bitcoin.id}`
            contractAddress = 'bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmql8k8'
          } else if (currency.code.includes('sol')) {
            chainId = `${solana.id}`
            if (currency.code === 'sol') {
              contractAddress = '11111111111111111111111111111111'
            }
          } else {
            contractAddress = contractAddress.toLowerCase()
          }
          return {
            name: currency.name,
            type: currency.type,
            notAllowedCountries: currency.notAllowedCountries,
            notAllowedUSStates: currency.notAllowedUSStates,
            code: currency.code,
            chainId: chainId,
            contractAddress: contractAddress
          }
        })
    }

    const currency = supportedCurrencies.find(
      (currency) =>
        currency.chainId === `${token.chainId}` &&
        currency.contractAddress === token.address.toLowerCase()
    )

    if (currency) {
      const countryCode = geolocationResponse?.alpha2
      const state = geolocationResponse?.state
      if (countryCode) {
        const unsupportedCountry =
          currency.notAllowedCountries.includes(countryCode)
        const unsupportedState =
          countryCode === 'US' &&
          state &&
          currency.notAllowedUSStates.includes(state)
        return !unsupportedCountry && !unsupportedState
      } else {
        return false
      }
    }

    return false
  }, [token, moonPayCurrencies])
}
