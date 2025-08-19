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
    console.log('🎯 useEOADetection shouldDetect:', {
      hasWalletIsEOA: !!wallet?.isEOA,
      protocolVersion,
      isPreferV2: protocolVersion === 'preferV2',
      chainId,
      shouldDetect: result
    })
    return result
  }, [wallet?.isEOA, protocolVersion, chainId])

  useEffect(() => {
    if (!shouldDetect) {
      console.log('🎯 EOA detection skipped - shouldDetect is false')
      setExplicitDeposit(undefined)
      return
    }

    console.log('🎯 Starting EOA detection for explicitDeposit calculation...')
    
    const detectEOA = async () => {
      try {
        const isEOA = await wallet!.isEOA!(chainId!)
        const explicitDepositValue = !isEOA
        
        console.log('🎯 EOA Detection Hook Result:', {
          isEOA,
          explicitDepositValue,
          logic: 'explicitDeposit = !isEOA',
          meaning: isEOA ? 'EOA -> explicitDeposit=false (single tx)' : 'Smart Wallet -> explicitDeposit=true (batched tx)'
        })
        
        // George's correction: EOA = false, Smart wallet = true
        setExplicitDeposit(explicitDepositValue)
      } catch (error) {
        console.error('🎯 EOA Detection Hook Error:', error)
        setExplicitDeposit(undefined)
      }
    }

    detectEOA()
  }, [wallet?.address, chainId, shouldDetect])

  return explicitDeposit
}

export default useEOADetection
