import { type AdaptedWallet } from '@relayprotocol/relay-sdk'
import { useState, useEffect, useMemo } from 'react'

interface AtomicBatchSupportState {
  isSupported: boolean | null
  isLoading: boolean
  error: Error | null
}

const useAtomicBatchSupport = (wallet?: AdaptedWallet, chainId?: number) => {
  const [state, setState] = useState<AtomicBatchSupportState>({
    isSupported: null,
    isLoading: false,
    error: null
  })

  useEffect(() => {
    const checkAtomicBatchSupport = async () => {
      if (!wallet?.supportsAtomicBatch || !chainId) {
        setState({ isSupported: false, isLoading: false, error: null })
        return
      }

      setState((s) => ({ ...s, isLoading: true }))
      try {
        const supported = await wallet.supportsAtomicBatch(chainId)
        setState({ isSupported: supported, isLoading: false, error: null })
      } catch (e) {
        setState({
          isSupported: false,
          isLoading: false,
          error: e instanceof Error ? e : new Error('Unknown error')
        })
      }
    }

    checkAtomicBatchSupport()
  }, [wallet, chainId])

  return useMemo(() => state, [state])
}

export default useAtomicBatchSupport
