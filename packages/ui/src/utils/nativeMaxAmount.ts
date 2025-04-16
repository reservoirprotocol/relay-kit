import type { PublicClient } from 'viem'
import fetcher from './fetcher.js'
import {
  EVM_GAS_BUFFER_MULTIPLIER,
  BTC_FEE_BUFFER_FACTOR,
  MEMPOOL_API_URL,
  MINIMUM_GAS_PRICE_WEI,
  SVM_LAMPORTS_PER_SIGNATURE,
  SVM_DEFAULT_COMPUTE_UNITS,
  SVM_PRIORITY_FEE_BUFFER_MULTIPLIER,
  SVM_MINIMUM_PRIORITY_FEE_MICRO_LAMPORTS,
  SVM_DEFAULT_FALLBACK_PRIORITY_FEE_MICRO_LAMPORTS
} from '../constants/nativeCalculation.js'
import { type Connection, type RecentPrioritizationFees } from '@solana/web3.js'

/**
 * Calculates the gas buffer needed for a native EVM token transfer.
 * This buffer is estimated based on gas price and a standard limit,
 * then multiplied by a safety factor.
 *
 * @param publicClient - A VIEM PublicClient connected to the EVM chain.
 * @param balance - The total native balance of the user (used for early exit).
 * @param gasLimit - Optional: The gas limit to use for estimation (defaults to 400000n).
 * @returns The calculated gas buffer amount as a bigint, or 0n if estimation fails or balance is zero.
 */
export const calculateEvmNativeGasBuffer = async (
  publicClient: PublicClient,
  balance: bigint,
  gasLimit: bigint = 400000n // Default gas limit
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
    let gasPriceToUse = feeData.maxFeePerGas ?? feeData.gasPrice

    if (!gasPriceToUse || gasPriceToUse <= 0n) {
      console.error('Invalid gas price data received:', feeData)
      return 0n // Return 0 if gas price is invalid
    }

    if (gasPriceToUse < MINIMUM_GAS_PRICE_WEI) {
      gasPriceToUse = MINIMUM_GAS_PRICE_WEI
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

/**
 * Calculates the fee buffer needed for a native SVM (Solana) token transfer.
 * This buffer includes the base fee for signatures and an estimated priority fee
 * based on recent network activity, multiplied by a safety factor.
 *
 * @param connection - A Solana web3.js Connection object.
 * @param numSignatures - The estimated number of signatures required (default: 1).
 * @returns The calculated fee buffer amount in lamports as a bigint, or 0n if estimation fails.
 */
export const calculateSvmNativeFeeBuffer = async (
  connection: Connection,
  numSignatures: number = 1 // Default to 1 signature for simple transfers
): Promise<bigint> => {
  try {
    console.log(
      '[Relay UI] calculateSvmNativeFeeBuffer: Starting calculation...'
    )
    // 1. Calculate Base Fee
    const baseFee = BigInt(numSignatures) * SVM_LAMPORTS_PER_SIGNATURE
    console.log(
      `[Relay UI] calculateSvmNativeFeeBuffer: Base fee (for ${numSignatures} sigs): ${baseFee} lamports`
    )

    // 2. Estimate Priority Fee
    let medianPriorityFeeMicroLamports = SVM_MINIMUM_PRIORITY_FEE_MICRO_LAMPORTS
    try {
      // Fetch recent priority fees (consider fees for specific accounts if needed later)
      console.log(
        '[Relay UI] calculateSvmNativeFeeBuffer: Fetching recent prioritization fees...'
      )
      const recentFees = await connection.getRecentPrioritizationFees()
      console.log(
        `[Relay UI] calculateSvmNativeFeeBuffer: Fetched ${recentFees.length} recent fees. First few:`,
        recentFees.slice(0, 5)
      )

      if (recentFees.length > 0) {
        // Filter out zero fees and sort (using number initially)
        const nonZeroFees = recentFees
          .map((f: RecentPrioritizationFees) => f.prioritizationFee) // Use number type from RecentPrioritizationFees
          .filter((fee: number) => fee > 0) // Use number type
          .sort((a: number, b: number) => a - b) // Use number type

        console.log(
          `[Relay UI] calculateSvmNativeFeeBuffer: Found ${nonZeroFees.length} non-zero fees. Sorted:`,
          nonZeroFees.slice(0, 10)
        )

        if (nonZeroFees.length > 0) {
          // Calculate median of non-zero fees
          const mid = Math.floor(nonZeroFees.length / 2)
          let medianNumber: number
          if (nonZeroFees.length % 2 === 0) {
            medianNumber = (nonZeroFees[mid - 1] + nonZeroFees[mid]) / 2
          } else {
            medianNumber = nonZeroFees[mid]
          }
          console.log(
            `[Relay UI] calculateSvmNativeFeeBuffer: Calculated median (number): ${medianNumber}`
          )
          // Convert median to BigInt for further calculations
          medianPriorityFeeMicroLamports = BigInt(Math.ceil(medianNumber))
        } else {
          console.log(
            '[Relay UI] calculateSvmNativeFeeBuffer: All recent fees were zero.'
          )
        }
        // If all recent fees were 0, we keep the minimum default
        console.log(
          `[Relay UI] calculateSvmNativeFeeBuffer: Median priority fee used (micro-lamports/CU): ${medianPriorityFeeMicroLamports}`
        )
      }
      // If recentFees is empty, keep the minimum default
    } catch (priorityFeeError) {
      console.warn(
        '[Relay UI] calculateSvmNativeFeeBuffer: Failed to fetch/process priority fees, using minimum:',
        priorityFeeError
      )
      // Use a reasonable fallback default priority fee on error instead of the absolute minimum
      medianPriorityFeeMicroLamports =
        SVM_DEFAULT_FALLBACK_PRIORITY_FEE_MICRO_LAMPORTS
      console.log(
        `[Relay UI] calculateSvmNativeFeeBuffer: Using fallback priority fee: ${medianPriorityFeeMicroLamports} micro-lamports/CU`
      )
    }

    // Ensure priority fee is at least the minimum
    if (
      medianPriorityFeeMicroLamports < SVM_MINIMUM_PRIORITY_FEE_MICRO_LAMPORTS
    ) {
      console.log(
        `[Relay UI] calculateSvmNativeFeeBuffer: Calculated median ${medianPriorityFeeMicroLamports} was below minimum ${SVM_MINIMUM_PRIORITY_FEE_MICRO_LAMPORTS}, using minimum.`
      )
      medianPriorityFeeMicroLamports = SVM_MINIMUM_PRIORITY_FEE_MICRO_LAMPORTS
    }

    // Calculate estimated priority fee cost in lamports
    // Priority fee is in micro-lamports per CU. 1 lamport = 1,000,000 micro-lamports.
    const estimatedPriorityFee =
      (medianPriorityFeeMicroLamports * SVM_DEFAULT_COMPUTE_UNITS) / 1_000_000n

    // 3. Apply Buffer to Priority Fee and Calculate Total
    const bufferedPriorityFee =
      estimatedPriorityFee * SVM_PRIORITY_FEE_BUFFER_MULTIPLIER
    const totalBufferedFee = baseFee + bufferedPriorityFee

    console.log(
      `[Relay UI] calculateSvmNativeFeeBuffer: Estimated Priority Fee: ${estimatedPriorityFee} lamports (median: ${medianPriorityFeeMicroLamports} micro-lamports/CU, units: ${SVM_DEFAULT_COMPUTE_UNITS})`
    )
    console.log(
      `[Relay UI] calculateSvmNativeFeeBuffer: Buffered Priority Fee: ${bufferedPriorityFee} lamports (multiplier: ${SVM_PRIORITY_FEE_BUFFER_MULTIPLIER})`
    )
    console.log(
      `[Relay UI] calculateSvmNativeFeeBuffer: Total Buffered Fee: ${totalBufferedFee} lamports (Base: ${baseFee}, Buffered Priority: ${bufferedPriorityFee})`
    )

    return totalBufferedFee
  } catch (error) {
    console.error(
      '[Relay UI] calculateSvmNativeFeeBuffer: Error during calculation:',
      error
    )
    return 0n // Return 0 buffer on any unexpected error
  }
}
