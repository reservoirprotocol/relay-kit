// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: [
      '@dynamic-labs/sdk-react-core',
      '@reservoir0x/relay-kit-ui',
      'viem'
    ]
  },
  transpilePackages: [
    '@dynamic-labs/wagmi-connector',
    '@dynamic-labs/sdk-react-core',
    '@dynamic-labs/wallet-book'
  ]
}

export default nextConfig
