import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      'packages/design-system',
      'packages/hooks',
      'packages/relay-ethers-wallet-adapter',
      'packages/ui'
    ]
  }
})
