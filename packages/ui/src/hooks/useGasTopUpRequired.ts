import type { Token } from '../types/index.js'
import useCurrencyBalance from '../hooks/useCurrencyBalance.js'
import { type RelayChain } from '@reservoir0x/relay-sdk'
import { useTokenPrice } from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from '../hooks/index.js'

export default (
  chain?: RelayChain,
  token?: Token,
  address?: string,
  balanceThresholdUsd: string = '2',
  topUpAmountUsd: string = '2'
): { required: boolean; amount?: bigint; amountUsd?: string } => {
  const client = useRelayClient()
  const isErc20Currency = token && token.address !== chain?.currency?.address
  const enabled =
    token !== undefined &&
    address !== undefined &&
    chain !== undefined &&
    chain?.currency?.address !== undefined &&
    chain?.currency?.supportsBridging &&
    chain?.vmType === 'evm' &&
    isErc20Currency

  const { value: gasBalance } = useCurrencyBalance({
    chain,
    address,
    currency: chain?.currency?.address
      ? (chain.currency.address as string)
      : undefined,
    enabled
  })

  const { data: usdTokenPriceResponse } = useTokenPrice(
    client?.baseApiUrl,
    {
      address: chain?.currency?.address ?? '',
      chainId: chain?.id ?? 0
    },
    {
      refetchInterval: 60000 * 5, //5 minutes
      refetchOnWindowFocus: false,
      enabled
    }
  )

  if (enabled && gasBalance && usdTokenPriceResponse?.price) {
    const tokenDecimals = chain?.currency?.decimals ?? 18
    const balanceThreshold =
      (BigInt(+balanceThresholdUsd * 10 ** 6) * BigInt(10 ** tokenDecimals)) /
      BigInt(usdTokenPriceResponse.price * 10 ** 6)

    const topUpAmount =
      (BigInt(+topUpAmountUsd * 10 ** 6) * BigInt(10 ** tokenDecimals)) /
      BigInt(usdTokenPriceResponse.price * 10 ** 6)
    const requiresTopUp = balanceThreshold > gasBalance

    return {
      required: requiresTopUp,
      amount: requiresTopUp ? topUpAmount : undefined,
      amountUsd: requiresTopUp ? topUpAmountUsd : undefined
    }
  } else {
    return {
      required: false,
      amount: undefined,
      amountUsd: undefined
    }
  }
}
