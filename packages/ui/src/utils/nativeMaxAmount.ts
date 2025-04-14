import type { PublicClient } from 'viem'
import fetcher from './fetcher.js'
import {
  EVM_GAS_BUFFER_MULTIPLIER,
  BTC_FEE_BUFFER_FACTOR,
  MEMPOOL_API_URL
} from '../constants/nativeCalculation.js'

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
    const buffer = estimatedGasCost * EVM_GAS_BUFFER_MULTIPLIER // Use constant

    // return the calculated buffer
    return buffer
  } catch (error) {
    console.error('Error calculating EVM native gas buffer:', error)
    return 0n // Return 0 buffer on any unexpected error
  }
}

/**
 * Fetches Bitcoin mempool fee data and calculates a fee buffer.
 * This buffer is estimated based on average transaction size and median fee,
 * then multiplied by a safety factor.
 *
 * @returns The calculated fee buffer amount in satoshis as a bigint, or 0n if estimation fails.
 */
export const calculateBitcoinNativeFeeBuffer = async (): Promise<bigint> => {
  try {
    const data = await fetcher(MEMPOOL_API_URL) // Use constant

    // Basic validation of the response structure
    if (
      !data ||
      !Array.isArray(data) ||
      data.length === 0 ||
      !data[0] ||
      typeof data[0].blockVSize !== 'number' ||
      typeof data[0].nTx !== 'number' ||
      typeof data[0].medianFee !== 'number' ||
      !Array.isArray(data[0].feeRange) ||
      data[0].feeRange.length === 0 ||
      data[0].nTx === 0
    ) {
      console.warn('Invalid or incomplete data from Mempool API:', data)
      return 0n
    }

    const { blockVSize, nTx, medianFee, feeRange } = data[0]

    // Use vBytes for calculation as fees are typically sat/vB
    const averageTxVBytes = blockVSize / nTx
    // Use medianFee if > 0, otherwise fallback to the lowest fee in feeRange
    const feeRateToUse = medianFee > 0 ? medianFee : feeRange[0]

    // feeRateToUse is in sat/vB
    const estimatedFeeSatsFloat = averageTxVBytes * feeRateToUse

    // Calculate buffer in satoshis, rounding up, then convert to BigInt
    const bufferAmount = BigInt(
      Math.ceil(estimatedFeeSatsFloat * BTC_FEE_BUFFER_FACTOR)
    ) // Use constant

    return bufferAmount
  } catch (error) {
    console.error('Error calculating Bitcoin native fee buffer:', error)
    return 0n
  }
}
