import { useMemo } from 'react'
import useIpAddress from './useIpAddress.js'
import useMoonPayCurrencies from './useMoonPayCurrencies.js'
import useMoonPayGeolocation from './useMoonPayGeolocation.js'
import { convertSupportedCurrencies } from '../utils/moonPay.js'
import type { Token } from '../types/index.js'

export default function useSupportedMoonPayCurrencyCode(
  codes: string[],
  apiKey?: string,
  token?: Token
) {
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
    const supportedCurrenciesMap = supportedCurrencies.reduce(
      (map, currency) => {
        map[currency.code] = currency
        return map
      },
      {} as Record<string, (typeof supportedCurrencies)[0]>
    )

    let supportedMoonPayCurrencyCode: string | undefined

    if (!geolocationResponse) {
      supportedMoonPayCurrencyCode = codes.find((code) => {
        const currency = supportedCurrenciesMap[code]
        return token?.chainId
          ? currency && currency.chainId !== `${token.chainId}`
          : currency !== undefined
      })
    } else {
      supportedMoonPayCurrencyCode = codes.find((code) => {
        const currency = supportedCurrenciesMap[code]
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
            return (
              !unsupportedCountry &&
              !unsupportedState &&
              (token?.chainId ? currency.chainId !== `${token.chainId}` : true)
            )
          } else {
            return false
          }
        }
      })
    }

    return supportedCurrenciesMap[supportedMoonPayCurrencyCode ?? 'eth']
  }, [codes, moonPayCurrencies, geolocationResponse, token])
}
