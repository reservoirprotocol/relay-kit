import { useMemo } from 'react'
import type { Token } from '../types'
import useMoonPayCurrencies from './useMoonPayCurrencies.js'
import useIpAddress from './useIpAddress.js'
import useMoonPayGeolocation from './useMoonPayGeolocation.js'
import _moonPayCurrencies from '../constants/moonPayCurrencies.js'
import { convertSupportedCurrencies } from '../utils/moonPay.js'

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
    const supportedCurrencies = convertSupportedCurrencies(moonPayCurrencies)

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
