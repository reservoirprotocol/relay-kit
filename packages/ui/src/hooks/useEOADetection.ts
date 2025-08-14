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
  const [explicitDeposit, setExplicitDeposit] = useState<boolean | undefined>(
    undefined
  )

  const shouldDetect = useMemo(() => {
    const result = !!(wallet?.isEOA && protocolVersion === 'preferV2' && chainId)
    console.log('EOA Detection shouldDetect:', { 
      hasWalletIsEOA: !!wallet?.isEOA, 
      protocolVersion, 
      chainId, 
      shouldDetect: result 
    })
    return result
  }, [wallet?.isEOA, protocolVersion, chainId])

  useEffect(() => {
    if (!shouldDetect) {
      setExplicitDeposit(undefined)
      return
    }

    const detectEOA = async () => {
      try {
        const isEOA = await wallet!.isEOA!(chainId!)
        console.log('EOA Detection Result:', { isEOA, explicitDeposit: !isEOA })
        // George's correction: EOA = false, Smart wallet = true
        setExplicitDeposit(!isEOA)
      } catch (error) {
        console.error('EOA Detection Error:', error)
        setExplicitDeposit(undefined)
      }
    }

    detectEOA()
  }, [wallet?.address, chainId, shouldDetect])

  return explicitDeposit
}

export default useEOADetection
