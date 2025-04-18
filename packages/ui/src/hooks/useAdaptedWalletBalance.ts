import { useQuery } from '@tanstack/react-query'
import type { AdaptedWallet, RelayChain } from '@reservoir0x/relay-sdk'
import type { Address } from 'viem'

type UseAdaptedWalletBalanceProps = {
  wallet?: AdaptedWallet
  chain?: RelayChain
  address?: Address | string
  currency?: Address | string
  enabled?: boolean
  refreshInterval?: number
}

const useAdaptedWalletBalance = ({
  wallet,
  chain,
  address,
  currency,
  enabled = true,
  refreshInterval = 60000
}: UseAdaptedWalletBalanceProps) => {
  const queryKey = [
    'adaptedWalletBalance',
    wallet?.vmType,
    chain?.id,
    address,
    currency
  ]
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!wallet?.getBalance || !chain?.id || !address) return undefined
      return wallet.getBalance(chain.id, address, currency)
    },
    enabled: Boolean(wallet?.getBalance && enabled && chain?.id && address),
    refetchInterval: refreshInterval
  })

  return {
    ...query,
    queryKey
  }
}

export default useAdaptedWalletBalance
