import { useReadContract } from 'wagmi'
import { AGWRegistryABI } from '../constants/agwRegistryAbi.js'
import { isAddress } from 'viem'
import { EventNames } from '~sdk/constants/events.js'
import { useEffect } from 'react'

const AGW_REGISTRY_ADDRESS = '0xd5E3efDA6bB5aB545cc2358796E96D9033496Dda'

export default function useIsAGW(
  address?: string,
  enabled?: boolean,
  onAnalyticEvent?: (event: string, data: Record<string, any>) => void
) {
  const response = useReadContract({
    abi: AGWRegistryABI,
    functionName: 'isAGW',
    address: AGW_REGISTRY_ADDRESS,
    chainId: 2741,
    args: address && isAddress(address) ? [address] : undefined,
    query: {
      enabled:
        Boolean(address && isAddress(address)) &&
        (enabled !== undefined ? enabled : true),
      staleTime: Infinity,
      gcTime: Infinity
    }
  })

  useEffect(() => {
    if (address && response.isError) {
      onAnalyticEvent?.(EventNames.AGW_CHECK_ERROR, {
        error: response.error,
        address
      })
    }
  }, [response.isError, response.error])

  return response.isError ? false : (response.data as boolean)
}
