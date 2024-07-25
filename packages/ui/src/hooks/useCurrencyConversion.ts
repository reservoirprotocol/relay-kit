import { useQuery } from '@tanstack/react-query'

export default function usePrices(enabled: boolean) {
  const path = new URL(`https://api.relay.link/prices/rates`).href

  const fetchPrices = async () => {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }

  return useQuery<Record<string, number>>({
    queryKey: ['prices', path],
    queryFn: fetchPrices,
    enabled,
    refetchInterval: 60000, // 1m
    staleTime: Infinity,
    gcTime: Infinity
  })
}
