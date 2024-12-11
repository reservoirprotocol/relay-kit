/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@reservoir0x/relay-kit-ui'],
}

module.exports = nextConfig
