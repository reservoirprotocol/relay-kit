import type { PublicClient } from 'viem'

/**
 * Calculates the maximum spendable amount for a native EVM token
 * by subtracting a buffer based on estimated gas costs.
 *
 * @param publicClient - A VIEM PublicClient connected to the EVM chain.
 * @param balance - The total native balance of the user.
 * @param gasLimit - Optional: The gas limit to use for estimation (defaults to 210000n).
 * @returns The calculated maximum spendable amount as a bigint.
 */
export const calculateEvmNativeMaxAmount = async (
  publicClient: PublicClient,
  balance: bigint,
  gasLimit: bigint = 210000n // Default gas limit
): Promise<bigint> => {
  let maxAmount = 0n

  if (!balance || balance <= 0n) {
    return 0n // Return 0 if balance is zero or negative
  }

  /**
   * Estimate the gas price using EIP-1559 if available,
   * otherwise use the legacy gas price.
   */
  try {
    let feeData
    try {
      feeData = await publicClient.estimateFeesPerGas()
    } catch (eip1559Error) {
      try {
        const gasPrice = await publicClient.getGasPrice()
        feeData = {
          maxFeePerGas: gasPrice,
          gasPrice: gasPrice
        }
      } catch (legacyError) {
        return 0n
      }
    }

    // Prefer EIP-1559 maxFeePerGas if available, otherwise use gasPrice
    const gasPriceToUse = feeData.maxFeePerGas ?? feeData.gasPrice

    if (!gasPriceToUse) {
      return 0n
    } else {
      const estimatedGasCost = gasPriceToUse * gasLimit
      const buffer = estimatedGasCost * 2n // 200% buffer

      if (balance > buffer) {
        maxAmount = balance - buffer
      } else {
        maxAmount = 0n // Cannot cover buffer, already sets maxAmount to 0n
      }
    }
    return maxAmount
  } catch (error) {
    return 0n
  }
}
