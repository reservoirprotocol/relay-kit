export const MINIMUM_GAS_PRICE_WEI = 100000000n // 0.1 Gwei
export const EVM_GAS_BUFFER_MULTIPLIER = 2n // 2x buffer
export const BTC_FEE_BUFFER_FACTOR = 1.75 // 1.75x buffer
export const MEMPOOL_API_URL =
  'https://mempool.space/api/v1/fees/mempool-blocks'
export const SVM_RELAY_REQUESTS_API_BASE_URL =
  'https://api.relay.link/requests/v2'
export const SOLANA_FEE_BUFFER_MULTIPLIER = 3n // 3x buffer for Solana
export const SOLANA_DEFAULT_FEE_LAMPORTS = 1000000n // Default fee in lamports (0.001 SOL) for Solana
export const ECLIPSE_FEE_BUFFER_MULTIPLIER = 100n // 100x buffer for Eclipse
export const ECLIPSE_DEFAULT_FEE_WEI = 50000000000000n // Default fee in Wei (0.00005 ETH) for Eclipse
