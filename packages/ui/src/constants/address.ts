import type { ChainVM } from '@reservoir0x/relay-sdk'

export const evmDeadAddress =
  '0x000000000000000000000000000000000000dead' as const
export const solDeadAddress = '11111111111111111111111111111111' as const //need to check this

<<<<<<< HEAD
export const getDeadAddress = (vmType?: 'evm' | 'svm' | 'bvm') => {
=======
export const getDeadAddress = (vmType?: ChainVM) => {
>>>>>>> fdc4cc371559b43c020a2f443299b16101d98fe3
  if (vmType === 'svm') {
    return solDeadAddress
  } else {
    return evmDeadAddress
  }
}
