import {
  type Address,
  type GetBalanceErrorType,
  isAddress,
  type ReadContractErrorType,
  zeroAddress
} from 'viem'
import { useBalance, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import type { QueryKey } from '@tanstack/react-query'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import useDuneBalances from './useDuneBalances.js'
import useBitcoinBalance from './useBitcoinBalance.js'
import { isValidAddress } from '../utils/address.js'
import useRelayClient from './useRelayClient.js'

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
  isDuneBalance: boolean
  hasPendingBalance?: boolean
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
  const isValidEvmAddress = address && isAddress(address)
  const relayClient = useRelayClient()

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
        !isErc20Currency &&
          chain &&
          chain.vmType === 'evm' &&
          isValidEvmAddress &&
          enabled
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
        isErc20Currency &&
          chain &&
          chain.vmType === 'evm' &&
          isValidEvmAddress &&
          enabled
      ),
      refetchInterval: refreshInterval
    }
  })

  const _isValidAddress = isValidAddress(chain?.vmType, address, chain?.id)

  const duneBalances = useDuneBalances(
    address,
    relayClient?.baseApiUrl?.includes('testnet') ? 'testnet' : 'mainnet',
    {
      enabled: Boolean(
        chain && chain.vmType === 'svm' && address && _isValidAddress && enabled
      ),
      staleTime: refreshInterval,
      gcTime: refreshInterval
    }
  )

  const bitcoinBalances = useBitcoinBalance(address, {
    enabled: Boolean(
      chain && chain.vmType === 'bvm' && address && _isValidAddress && enabled
    ),
    gcTime: refreshInterval,
    staleTime: refreshInterval
  })

  if (chain?.vmType === 'evm') {
    const value = isErc20Currency ? erc20Balance : ethBalance?.value
    const error = isErc20Currency ? erc20Error : ethError
    const isError = isErc20Currency ? isErc20Error : isEthError
    const queryKey = isErc20Currency ? erc20BalanceQueryKey : ethBalanceQueryKey
    const isLoading = isErc20Currency
      ? erc20BalanceIsLoading
      : ethBalanceIsLoading
    return { value, queryKey, isLoading, isError, error, isDuneBalance: false }
  } else if (chain?.vmType === 'svm') {
    if (_isValidAddress) {
      return {
        value:
          currency &&
          duneBalances.balanceMap &&
          duneBalances.balanceMap[`${chain.id}:${currency}`] &&
          duneBalances.balanceMap[`${chain.id}:${currency}`].amount
            ? BigInt(
                duneBalances.balanceMap[`${chain.id}:${currency}`].amount ?? 0
              )
            : undefined,
        queryKey: duneBalances.queryKey,
        isLoading: duneBalances.isLoading,
        isError: duneBalances.isError,
        error: duneBalances.error,
        isDuneBalance: true
      }
    } else {
      return {
        value: undefined,
        queryKey: duneBalances.queryKey,
        isLoading: duneBalances.isLoading,
        isError: duneBalances.isError,
        error: duneBalances.error,
        isDuneBalance: true
      }
    }
  } else if (chain?.vmType === 'bvm') {
    if (_isValidAddress) {
      return {
        value:
          currency && bitcoinBalances.balance
            ? bitcoinBalances.balance
            : undefined,
        queryKey: bitcoinBalances.queryKey,
        isLoading: bitcoinBalances.isLoading,
        isError: bitcoinBalances.isError,
        error: bitcoinBalances.error,
        isDuneBalance: false,
        hasPendingBalance:
          bitcoinBalances.data?.pendingBalance &&
          bitcoinBalances.data?.pendingBalance > 0n
            ? true
            : false
      }
    } else {
      return {
        value: undefined,
        queryKey: bitcoinBalances.queryKey,
        isLoading: bitcoinBalances.isLoading,
        isError: bitcoinBalances.isError,
        error: bitcoinBalances.error,
        isDuneBalance: false,
        hasPendingBalance: false
      }
    }
  } else {
    return {
      value: undefined,
      queryKey: duneBalances.queryKey,
      isLoading: duneBalances.isLoading,
      isError: duneBalances.isError,
      error: duneBalances.error,
      isDuneBalance: false
    }
  }
}

export default useCurrencyBalance
