export const evmDeadAddress =
  '0x000000000000000000000000000000000000dead' as const
export const solDeadAddress =
  '1nc1nerator11111111111111111111111111111111' as const //need to check this

export const getDeadAddress = (vmType?: 'evm' | 'svm') => {
  if (vmType === 'svm') {
    return solDeadAddress
  } else {
    return evmDeadAddress
  }
}
