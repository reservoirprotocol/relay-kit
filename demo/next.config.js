// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: [
      '@dynamic-labs/sdk-react-core',
      '@dynamic-labs/bitcoin',
      '@dynamic-labs/eclipse',
      '@dynamic-labs/ethereum',
      '@dynamic-labs/ethereum-core',
      '@dynamic-labs/solana',
      '@dynamic-labs/sui',
      '@dynamic-labs/utils',
      '@dynamic-labs/wagmi-connector',
      '@dynamic-labs-connectors/abstract-global-wallet-evm'
    ]
  }
}

export default nextConfig
