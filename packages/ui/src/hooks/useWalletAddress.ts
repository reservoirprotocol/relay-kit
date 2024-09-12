import { useEffect, useState } from 'react'
import type { AdaptedWallet } from '@reservoir0x/relay-sdk'
import type { Address } from 'viem'

export default function (wallet?: AdaptedWallet): string | Address | undefined {
  const [address, setAddress] = useState<string | Address | undefined>()

  useEffect(() => {
    const getWalletAddress = async (wallet?: AdaptedWallet) => {
      if (wallet) {
        const walletAddress = await wallet.address()
        setAddress(walletAddress)
      } else {
        setAddress(undefined)
      }
    }

    getWalletAddress(wallet)
  }, [wallet])

  return address
}
