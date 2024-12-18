export const isChainLocked = (
  chainId: number | undefined,
  lockChainId: number | undefined,
  otherTokenChainId: number | undefined
) => {
  if (lockChainId === undefined) return false

  // If this token is on the locked chain, only lock it if the other token isn't
  if (chainId === lockChainId) {
    return otherTokenChainId !== lockChainId
  }

  return false
}
