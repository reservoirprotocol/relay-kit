import {
  type Address,
  type GetBalanceErrorType,
  type ReadContractErrorType,
  zeroAddress
} from 'viem'
import { useBalance, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import type { QueryKey } from '@tanstack/react-query'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import useDuneBalances from './useDuneBalances.js'

type UseBalanceProps = {
  chain?: RelayChain
  address?: Address | string
  currency?: Address | string
  enabled?: boolean
  refreshInterval?: number
}

type UseCurrencyBalanceData = {
  value?: bigint
  queryKey: QueryKey
  isLoading: boolean
  isError: boolean | GetBalanceErrorType | null
  error: boolean | ReadContractErrorType | Error | null
}

// Handle fetching the balance of both native eth and erc20s
const useCurrencyBalance = ({
  chain,
  address,
  currency,
  enabled = true,
  refreshInterval = 60000
}: UseBalanceProps): UseCurrencyBalanceData => {
  const isErc20Currency = currency && currency !== zeroAddress

  const {
    data: ethBalance,
    queryKey: ethBalanceQueryKey,
    isLoading: ethBalanceIsLoading,
    isError: ethError,
    error: isEthError
  } = useBalance({
    chainId: chain?.id,
    address: address as Address,
    query: {
      enabled: Boolean(
        !isErc20Currency && chain && chain.vmType === 'evm' && enabled
      ),
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
    chainId: chain?.id,
    address: currency as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address as Address] : undefined,
    query: {
      enabled: Boolean(
        isErc20Currency && chain && chain.vmType === 'evm' && enabled
      ),
      refetchInterval: refreshInterval
    }
  })

  const duneBalances = useDuneBalances(
    address,
    {
      enabled: Boolean(chain && chain.vmType === 'svm' && address && enabled)
    },
    chain
  )

  if (chain?.vmType === 'evm') {
    const value = isErc20Currency ? erc20Balance : ethBalance?.value
    const error = isErc20Currency ? erc20Error : ethError
    const isError = isErc20Currency ? isErc20Error : isEthError
    const queryKey = isErc20Currency ? erc20BalanceQueryKey : ethBalanceQueryKey
    const isLoading = isErc20Currency
      ? erc20BalanceIsLoading
      : ethBalanceIsLoading
    return { value, queryKey, isLoading, isError, error }
  } else {
    return {
      value:
        currency && duneBalances.balanceMap
          ? BigInt(duneBalances.balanceMap[currency as string].amount ?? 0)
          : undefined,
      queryKey: duneBalances.queryKey,
      isLoading: duneBalances.isLoading,
      isError: duneBalances.isError,
      error: duneBalances.error
    }
  }
}

export default useCurrencyBalance
