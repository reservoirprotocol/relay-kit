// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  bundlePagesRouterDependencies: true,
  transpilePackages: [
    '@dynamic-labs/wagmi-connector',
    '@dynamic-labs/sdk-react-core',
    '@dynamic-labs/wallet-book'
  ]
}

export default nextConfig
