import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const detectEOA = async () => {
      if (
        wallet?.isEOA &&
        protocolVersion === 'preferV2' &&
        chainId
      ) {
        try {
          const isEOA = await wallet.isEOA(chainId)
          const explicitDepositValue = !isEOA
          setExplicitDeposit(explicitDepositValue)
        } catch (error) {
          setExplicitDeposit(undefined)
        }
      } else {
        setExplicitDeposit(undefined)
      }
    }
    
    detectEOA()
  }, [wallet, protocolVersion, chainId])

  return explicitDeposit
}

export default useEOADetection