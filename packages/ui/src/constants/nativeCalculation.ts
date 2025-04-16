export const MINIMUM_GAS_PRICE_WEI = 100000000n // 0.1 Gwei
export const EVM_GAS_BUFFER_MULTIPLIER = 2n // 2x buffer
export const BTC_FEE_BUFFER_FACTOR = 1.75 // 1.75x buffer
export const MEMPOOL_API_URL =
  'https://mempool.space/api/v1/fees/mempool-blocks'

// SVM Constants
export const SVM_LAMPORTS_PER_SIGNATURE = 5000n // Standard fee per required signature
export const SVM_DEFAULT_COMPUTE_UNITS = 200_000n // Default compute units assumed for buffer calculation
export const SVM_PRIORITY_FEE_BUFFER_MULTIPLIER = 2n // Safety multiplier for the dynamic priority fee
export const SVM_MINIMUM_PRIORITY_FEE_MICRO_LAMPORTS = 1n // Minimum priority fee to use if API returns 0
export const SVM_DEFAULT_FALLBACK_PRIORITY_FEE_MICRO_LAMPORTS = 5000n // Default fallback priority fee in micro-lamports to use if RPC call fails
