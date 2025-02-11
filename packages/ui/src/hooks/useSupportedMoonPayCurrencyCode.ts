import { useMemo } from 'react'
import useIpAddress from './useIpAddress.js'
import useMoonPayCurrencies from './useMoonPayCurrencies.js'
import useMoonPayGeolocation from './useMoonPayGeolocation.js'
import { convertSupportedCurrencies } from '../utils/moonPay.js'

export default function useSupportedMoonPayCurrencyCode(
  codes: string[],
  apiKey?: string
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
    if (!geolocationResponse) {
      return {
        name: 'USD Coin (Base)',
        type: 'crypto',
        notAllowedCountries: ['CA'],
        notAllowedUSStates: ['NY', 'VI'],
        code: 'usdc_base',
        chainId: '8453',
        contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      }
    }

    const supportedCurrencies = convertSupportedCurrencies(moonPayCurrencies)
    const supportedCurrenciesMap = supportedCurrencies.reduce(
      (map, currency) => {
        map[currency.code] = currency
        return map
      },
      {} as Record<string, (typeof supportedCurrencies)[0]>
    )

    const supportedMoonPayCurrency = codes.find((code) => {
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
          return !unsupportedCountry && !unsupportedState
        } else {
          return false
        }
      }
    })
    return supportedCurrenciesMap[supportedMoonPayCurrency ?? 'eth']
  }, [codes, moonPayCurrencies, geolocationResponse])
}
