import type { PublicClient } from 'viem'

/**
 * Calculates the gas buffer needed for a native EVM token transfer.
 * This buffer is estimated based on gas price and a standard limit,
 * then multiplied by a safety factor.
 *
 * @param publicClient - A VIEM PublicClient connected to the EVM chain.
 * @param balance - The total native balance of the user (used for early exit).
 * @param gasLimit - Optional: The gas limit to use for estimation (defaults to 210000n).
 * @returns The calculated gas buffer amount as a bigint, or 0n if estimation fails or balance is zero.
 */
export const calculateEvmNativeGasBuffer = async (
  publicClient: PublicClient,
  balance: bigint,
  gasLimit: bigint = 210000n // Default gas limit
): Promise<bigint> => {
  if (!balance || balance <= 0n) {
    return 0n // Return 0 if balance is zero or negative
  }

  try {
    let feeData
    try {
      feeData = await publicClient.estimateFeesPerGas()
    } catch (eip1559Error) {
      // Fallback to legacy gas price estimation
      try {
        const gasPrice = await publicClient.getGasPrice()
        feeData = {
          maxFeePerGas: gasPrice,
          gasPrice: gasPrice
        }
      } catch (legacyError) {
        // If both estimations fail, return 0 buffer
        console.error('Failed to estimate gas price:', legacyError)
        return 0n
      }
    }

    // Prefer EIP-1559 maxFeePerGas if available, otherwise use gasPrice
    const gasPriceToUse = feeData.maxFeePerGas ?? feeData.gasPrice

    if (!gasPriceToUse || gasPriceToUse <= 0n) {
      console.error('Invalid gas price data received:', feeData)
      return 0n // Return 0 if gas price is invalid
    }

    const estimatedGasCost = gasPriceToUse * gasLimit
    const buffer = estimatedGasCost * 2n // 200% buffer, representing the amount to reserve

    // return the calculated buffer
    return buffer
  } catch (error) {
    console.error('Error calculating EVM native gas buffer:', error)
    return 0n // Return 0 buffer on any unexpected error
  }
}
