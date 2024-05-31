import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  jsxFramework: 'react',
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    tokens: {
      spacing: {
        1: { value: '4px' },
        2: { value: '8px' },
        3: { value: '12px' },
        4: { value: '16px' },
        5: { value: '32px' },
        6: { value: '64px' }
      },
      fonts: {
        body: { value: 'var(--font-inter), sans-serif' }
      },
      colors: {
        // Primary
        primary1: { value: 'green' }
      }
    },
    extend: {}
  },

  // The output directory for your css system
  outdir: '../design-system',
  importMap: {
    css: '@reservoir0x/relay-design-system/css',
    recipes: '@reservoir0x/relay-design-system/recipes',
    patterns: '@reservoir0x/relay-design-system/patterns',
    jsx: '@reservoir0x/relay-design-system/jsx'
  }
})
