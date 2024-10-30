import type { ChainVM } from '../types/RelayChain.js'

export const evmDeadAddress =
  '0x000000000000000000000000000000000000dead' as const
export const solDeadAddress =
  'CbKGgVKLJFb8bBrf58DnAkdryX6ubewVytn7X957YwNr' as const
export const bitcoinDeadAddress = 'bc1q4vxn43l44h30nkluqfxd9eckf45vr2awz38lwa'

export const getDeadAddress = (vmType?: ChainVM) => {
  if (vmType === 'svm') {
    return solDeadAddress
  } else if (vmType === 'bvm') {
    return bitcoinDeadAddress
  } else {
    return evmDeadAddress
  }
}
