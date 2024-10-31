import type { Token } from '../types/index.js'
import { ASSETS_RELAY_API } from '@reservoir0x/relay-sdk'
import type { paths } from '@reservoir0x/relay-sdk'

type ApiCurrency = NonNullable<
  paths['/chains']['get']['responses']['200']['content']['application/json']['chains']
>[0]['currency']

export const convertApiCurrencyToToken = (
  currency: ApiCurrency | undefined | null,
  chainId: number
): Token => {
  return {
    chainId: Number(chainId),
    address: currency?.address ?? '',
    name: currency?.name ?? '',
    symbol: currency?.symbol ?? '',
    decimals: currency?.decimals ?? 0,
    logoURI: `${ASSETS_RELAY_API}/icons/currencies/${
      currency?.id ?? chainId
    }.png`,
    verified: true
  }
}
