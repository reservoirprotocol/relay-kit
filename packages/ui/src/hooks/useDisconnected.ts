import { useEffect, useRef } from 'react'
import type { Address } from 'viem'

const useDisconnected = (
  address?: Address | string,
  onDisconnected?: () => void
) => {
  const prevAddressRef = useRef<string | undefined>(address)

  useEffect(() => {
    if (prevAddressRef.current !== address && !address) {
      onDisconnected?.()
    }
    prevAddressRef.current = address
  }, [address, onDisconnected])
}

export default useDisconnected
