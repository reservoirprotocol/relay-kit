import type { ChainVM } from '../types/RelayChain.js'

export const evmDeadAddress =
  '0x000000000000000000000000000000000000dead' as const
export const solDeadAddress =
  'CbKGgVKLJFb8bBrf58DnAkdryX6ubewVytn7X957YwNr' as const
export const eclipseDeadAddress =
  'CrfbABN2sSvmoZLu9eDDfXpaC2nHg42R7AXbHs9eg4S9' as const
export const bitcoinDeadAddress = 'bc1q4vxn43l44h30nkluqfxd9eckf45vr2awz38lwa'
export const zeroDeadAddress = '0x03508bB71268BBA25ECaCC8F620e01866650532c'

export const getDeadAddress = (vmType?: ChainVM, chainId?: number) => {
  if (vmType === 'svm') {
    return chainId === 9286185 ? eclipseDeadAddress : solDeadAddress
  } else if (vmType === 'bvm') {
    return bitcoinDeadAddress
  } else if (chainId === 543210) {
    return zeroDeadAddress
  } else {
    return evmDeadAddress
  }
}
