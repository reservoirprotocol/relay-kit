import type { PublicClient } from 'viem'
import { formatUnits } from 'viem'

/**
 * Calculates the maximum spendable amount for a native EVM token
 * by subtracting a buffer based on estimated gas costs.
 *
 * @param publicClient - A VIEM PublicClient connected to the EVM chain.
 * @param balance - The total native balance of the user.
 * @param decimals - The decimals of the native token.
 * @param gasLimit - Optional: The gas limit to use for estimation (defaults to 210000n).
 * @returns The calculated maximum spendable amount as a bigint.
 */
export const calculateEvmNativeMaxAmount = async (
  publicClient: PublicClient,
  balance: bigint,
  decimals: number,
  gasLimit: bigint = 210000n // Default gas limit
): Promise<bigint> => {
  let maxAmount = 0n

  if (!balance || balance <= 0n) {
    return 0n // Return 0 if balance is zero or negative
  }

  try {
    console.log('Calculating EVM native max amount using gas estimation...')
    let feeData
    try {
      feeData = await publicClient.estimateFeesPerGas()
      console.log('EIP-1559 Fee Data:', feeData)
    } catch (eip1559Error) {
      console.warn(
        'EIP-1559 fee estimation failed, falling back to legacy gas price:',
        eip1559Error
      )
      try {
        const gasPrice = await publicClient.getGasPrice()
        console.log('Legacy Gas Price:', gasPrice)
        feeData = {
          maxFeePerGas: gasPrice, // Use legacy gasPrice if EIP-1559 fails
          gasPrice: gasPrice
        }
      } catch (legacyError) {
        console.error(
          'Failed to fetch any gas price, returning 0 for max amount:',
          legacyError
        )
        return 0n
      }
    }

    const gasPriceToUse = feeData.maxFeePerGas ?? feeData.gasPrice // Prefer EIP-1559

    if (!gasPriceToUse) {
      console.error(
        'Could not determine gas price, returning 0 for max amount.'
      )
      return 0n
    } else {
      const estimatedGasCost = gasPriceToUse * gasLimit
      const buffer = estimatedGasCost * 2n // 100% buffer
      console.log(
        'Calculated Gas Buffer:',
        formatUnits(buffer, decimals) // Use actual decimals
      )

      if (balance > buffer) {
        maxAmount = balance - buffer
      } else {
        console.warn(
          'Balance is less than calculated gas buffer. Setting max amount to 0.'
        )
        maxAmount = 0n // Cannot cover buffer, already sets maxAmount to 0n
      }
    }
    return maxAmount
  } catch (error) {
    console.error(
      'Unexpected error during gas estimation, returning 0 for max amount:',
      error
    )
    return 0n
  }
}
