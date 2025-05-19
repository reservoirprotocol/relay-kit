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
  }
}

export default nextConfig
