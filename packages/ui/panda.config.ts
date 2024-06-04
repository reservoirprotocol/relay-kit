import { defineConfig } from '@pandacss/dev'
import radixColorsPreset from 'pandacss-preset-radix-colors'

export const Colors = {
  // Primary
  primary1: { value: '{colors.violet.1}' },
  primary2: { value: '{colors.violet.2}' },
  primary3: { value: '{colors.violet.3}' },
  primary4: { value: '{colors.violet.4}' },
  primary5: { value: '{colors.violet.5}' },
  primary6: { value: '{colors.violet.6}' },
  primary7: { value: '{colors.violet.7}' },
  primary8: { value: '{colors.violet.8}' },
  primary9: { value: '{colors.violet.9}' },
  primary10: { value: '{colors.violet.10}' },
  primary11: { value: '{colors.violet.11}' },
  primary12: { value: '{colors.violet.12}' },
  // Gray
  gray1: { value: '{colors.slate.1}' },
  gray2: { value: '{colors.slate.2}' },
  gray3: { value: '{colors.slate.3}' },
  gray4: { value: '{colors.slate.4}' },
  gray5: { value: '{colors.slate.5}' },
  gray6: { value: '{colors.slate.6}' },
  gray7: { value: '{colors.slate.7}' },
  gray8: { value: '{colors.slate.8}' },
  gray9: { value: '{colors.slate.9}' },
  gray10: { value: '{colors.slate.10}' },
  gray11: { value: '{colors.slate.11}' },
  gray12: { value: '{colors.slate.12}' },
  // BlackA
  blackA10: { value: '{colors.black.a.10}' },
  // Blue
  blue12: { value: '{colors.blue.12}' },
  // Red
  red2: { value: '{colors.red.2}' },
  red3: { value: '{colors.red.3}' },
  red5: { value: '{colors.red.5}' },
  red6: { value: '{colors.red.6}' },
  red9: { value: '{colors.red.9}' },
  red10: { value: '{colors.red.10}' },
  red11: { value: '{colors.red.11}' },
  red12: { value: '{colors.red.12}' },
  // Green
  green2: { value: '{colors.green.2}' },
  green3: { value: '{colors.green.3}' },
  green10: { value: '{colors.green.10}' },
  green11: { value: '{colors.green.11}' },
  green12: { value: '{colors.green.12}' },
  // Yellow
  yellow9: { value: '{colors.yellow.9}' },
  yellow10: { value: '{colors.yellow.10}' },
  yellow11: { value: '{colors.yellow.11}' },
  yellow12: { value: '{colors.yellow.12}' },
  // Amber
  amber2: { value: '{colors.amber.2}' },
  amber9: { value: '{colors.amber.9}' },
  amber10: { value: '{colors.amber.10}' },
  amber11: { value: '{colors.amber.11}' },
  amber12: { value: '{colors.amber.12}' }
}

export default defineConfig({
  jsxFramework: 'react',
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  presets: [
    radixColorsPreset({
      darkMode: {
        condition: '.dark &'
      },
      colorScales: [
        'amber',
        'green',
        'slate',
        'gray',
        'violet',
        'red',
        'black',
        'yellow',
        'blue'
      ]
    }),
    // Re-add the panda preset if you want to keep
    // the default keyframes, breakpoints, tokens
    // and textStyles provided by PandaCSS
    '@pandacss/preset-panda'
  ],

  conditions: {
    extend: {
      dark: '.dark &, [data-theme="dark"] &',
      light: '.light &',
      typeNumber: '&[type=number]',
      placeholder_parent: '&[placeholder]',
      spinButtons: '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button',
      data_state_active: '&[data-state="active"]',
      data_state_open: '&[data-state="open"]',
      data_state_open_child: '[data-state=open] &',
      data_state_closed: '&[data-state="closed"]',
      data_swipe_move: '&[data-swipe="move"]',
      data_swipe_cancel: '&[data-swipe="cancel"]',
      data_swipe_end: '&[data-swipe="end"]',
      data_state_checked: '&[data-state="checked"]'
    }
  },

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
      colors: Colors,
      gradients: {
        success: { value: 'linear-gradient(to right, #30A46C, #0ADF79)' }
      }
    },
    semanticTokens: {
      colors: {
        neutralBg: { value: { base: 'white', _dark: '{colors.gray.1}' } },
        neutralBgSubtle: {
          value: { base: '{colors.gray.1}', _dark: '{colors.gray.3}' }
        },
        muted: { value: { base: '{colors.gray.3}' } },
        success: { value: { base: '{colors.green.11 }' } }
      }
    },
    extend: {
      breakpoints: {
        sm: '600px',
        md: '900px',
        lg: '1200px',
        xl: '1400px',
        bp300: '300px',
        bp400: '400px',
        bp500: '500px',
        bp600: '600px',
        bp700: '700px',
        bp800: '800px',
        bp900: '900px',
        bp1000: '1000px',
        bp1100: '1100px',
        bp1200: '1200px',
        bp1300: '1300px',
        bp1400: '1400px',
        bp1500: '1500px'
      },
      semanticTokens: {
        colors: {
          prose: {
            body: {
              value: '{colors.slate.12}'
            }
          }
        }
      }
    },
    keyframes: {
      pulse: {
        '50%': {
          opacity: '0.5'
        }
      },
      spin: {
        '100%': {
          transform: 'rotate(360deg)'
        }
      },
      collapsibleSlideDown: {
        from: { height: 0 },
        to: { height: 'var(--radix-collapsible-content-height)' }
      },
      collapsibleSlideUp: {
        from: { height: 'var(--radix-collapsible-content-height)' },
        to: { height: 0 }
      }
    }
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
