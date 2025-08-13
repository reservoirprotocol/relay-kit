import { useMemo, useEffect, useState } from 'react'
import type { AdaptedWallet } from '@reservoir0x/relay-sdk'

/**
 * Hook to detect if a wallet is an EOA and return the appropriate explicitDeposit flag
 * Only runs detection when protocol version is 'preferV2'
 */
const useEOADetection = (
  wallet?: AdaptedWallet,
  protocolVersion?: string,
  chainId?: number
): boolean | undefined => {
  const [explicitDeposit, setExplicitDeposit] = useState<boolean | undefined>(undefined)

  const shouldDetect = useMemo(() => {
    return !!(
      wallet?.isEOA &&
      protocolVersion === 'preferV2' &&
      chainId
    )
  }, [wallet?.isEOA, protocolVersion, chainId])

  useEffect(() => {
    if (!shouldDetect) {
      setExplicitDeposit(undefined)
      return
    }

    const detectEOA = async () => {
      try {
        const isEOA = await wallet!.isEOA!(chainId!)
        setExplicitDeposit(!isEOA)
      } catch (error) {
        setExplicitDeposit(undefined)
      }
    }
    
    detectEOA()
  }, [wallet, chainId, shouldDetect])

  return explicitDeposit
}

export default useEOADetection