import type { ChainVM } from '../types/RelayChain.js'

export const evmDeadAddress =
  '0x000000000000000000000000000000000000dead' as const
export const solDeadAddress = '11111111111111111111111111111111' as const //need to check this
export const bitcoinDeadAddress = 'bc1q0qfzuge7vr5s2xkczrjkccmxemlyyn8mhx298v'

export const getDeadAddress = (vmType?: ChainVM) => {
  if (vmType === 'svm') {
    return solDeadAddress
  } else if (vmType === 'bvm') {
    return bitcoinDeadAddress
  } else {
    return evmDeadAddress
  }
}
