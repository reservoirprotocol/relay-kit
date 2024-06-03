import { type Address, zeroAddress } from 'viem'
import { useBalance, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'

type UseBalanceProps = {
  chainId: number
  address?: Address
  currency?: Address
  enabled?: boolean
  refreshInterval?: number
}

// Handle fetching the balance of both native eth and erc20s
const useCurrencyBalance = ({
  chainId,
  address,
  currency,
  enabled = true,
  refreshInterval = 60000
}: UseBalanceProps) => {
  const isErc20Currency = currency && currency !== zeroAddress

  const {
    data: ethBalance,
    queryKey: ethBalanceQueryKey,
    isLoading: ethBalanceIsLoading,
    isError: ethError,
    error: isEthError
  } = useBalance({
    chainId: chainId,
    address: address,
    query: {
      enabled: !isErc20Currency && enabled,
      refetchInterval: refreshInterval
    }
  })

  const {
    data: erc20Balance,
    queryKey: erc20BalanceQueryKey,
    isLoading: erc20BalanceIsLoading,
    isError: isErc20Error,
    error: erc20Error
  } = useReadContract({
    chainId: chainId,
    address: currency,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isErc20Currency && enabled,
      refetchInterval: refreshInterval
    }
  })

  const value = isErc20Currency ? erc20Balance : ethBalance?.value
  const error = isErc20Currency ? erc20Error : ethError
  const isError = isErc20Currency ? isErc20Error : isEthError
  const queryKey = isErc20Currency ? erc20BalanceQueryKey : ethBalanceQueryKey
  const isLoading = isErc20Currency
    ? erc20BalanceIsLoading
    : ethBalanceIsLoading

  return { value, queryKey, isLoading, isError, error }
}

export default useCurrencyBalance
