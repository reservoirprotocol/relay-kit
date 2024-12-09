import type { Token } from '../types/index.js'
import { ASSETS_RELAY_API } from '@reservoir0x/relay-sdk'
import type { paths, RelayChain } from '@reservoir0x/relay-sdk'

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

export const findBridgableToken = (chain?: RelayChain, token?: Token) => {
  if (chain && token && token.chainId === chain.id) {
    const toCurrencies = [
      ...(chain?.erc20Currencies ?? []),
      chain.currency ?? undefined
    ]
    const toCurrency = toCurrencies.find((c) => c?.address === token?.address)

    if (!toCurrency || !toCurrency.supportsBridging) {
      const supportedToCurrency = toCurrencies.find((c) => c?.supportsBridging)
      if (supportedToCurrency) {
        return convertApiCurrencyToToken(supportedToCurrency, chain.id)
      }
    } else {
      return token
    }
  }
  return null
}
