import { defineConfig } from '@pandacss/dev'
import radixColorsPreset from 'pandacss-preset-radix-colors'
import postcss from 'postcss'
import postcssCascadeLayers from '@csstools/postcss-cascade-layers'

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
  green9: { value: '{colors.green.9}' },
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
  amber3: { value: '{colors.amber.3}' },
  amber4: { value: '{colors.amber.4}' },
  amber9: { value: '{colors.amber.9}' },
  amber10: { value: '{colors.amber.10}' },
  amber11: { value: '{colors.amber.11}' },
  amber12: { value: '{colors.amber.12}' }
}

export default defineConfig({
  jsxFramework: 'react',
  // Whether to use css reset
  preflight: {
    scope: '.relay-kit-reset'
  },

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  hooks: {
    'cssgen:done': ({ artifact, content }) => {
      if (artifact === 'styles.css') {
        return postcss([postcssCascadeLayers()]).process(content).css
      }
    }
  },

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
  prefix: 'relay',

  // Useful for theme customization
  theme: {
    tokens: {
      spacing: {
        1: { value: '4px' },
        2: { value: '8px' },
        3: { value: '12px' },
        4: { value: '16px' },
        5: { value: '32px' },
        6: { value: '64px' },
        'widget-card-section-gutter': { value: '6px' }
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
        'primary-color': { value: { base: '{colors.primary9}' } },
        'focus-color': { value: { base: '{colors.primary7}' } },
        'subtle-background-color': { value: { base: '{colors.gray.1}' } },
        'subtle-border-color': { value: { base: '{colors.gray.5}' } },

        // Text
        'text-default': { value: { base: '{colors.gray.12}' } },
        'text-subtle': { value: { base: '{colors.gray.11}' } },
        'text-subtle-secondary': { value: { base: '{colors.gray.11}' } },
        'text-error': { value: { base: '{colors.red.12}' } },
        'text-success': { value: { base: '{colors.green.11}' } },

        // Primary Button
        'primary-button-background': { value: { base: '{colors.primary9}' } },
        'primary-button-color': { value: { base: 'white' } },
        'primary-button-hover-background': {
          value: { base: '{colors.primary10}' }
        },
        'primary-button-hover-color': {
          value: { base: 'white' }
        },

        // Secondary Button
        'secondary-button-background': { value: { base: '{colors.primary3}' } },
        'secondary-button-color': { value: { base: '{colors.gray12}' } },
        'secondary-button-hover-background': {
          value: { base: '{colors.primary4}' }
        },
        'secondary-button-hover-color': {
          value: { base: '{colors.gray12}' }
        },

        // Tertiary Button
        'tertiary-button-background': { value: { base: '{colors.gray1}' } },
        'tertiary-button-color': { value: { base: '{colors.primary11}' } },
        'tertiary-button-hover-background': {
          value: { base: '{colors.primary2}' }
        },
        'tertiary-button-hover-color': {
          value: { base: '{colors.primary11}' }
        },

        // Disabled Button
        'button-disabled-background': {
          value: { base: '{colors.gray.8}' }
        },
        'button-disabled-color': {
          value: { base: '{colors.gray.11}' }
        },

        // Input
        'input-background': {
          value: { base: '{colors.gray.3}' }
        },
        'input-color': { value: { base: '{colors.gray.12}' } },

        // Anchor
        'anchor-color': { value: { base: '{colors.primary11}' } },
        'anchor-hover-color': { value: { base: '{colors.primary9}' } },

        // Dropdown
        'dropdown-background': { value: { base: '{colors.gray.3}' } },

        // Widget
        'widget-background': {
          value: { base: 'white', _dark: '{colors.gray.1}' }
        },
        'widget-card-background': { value: { base: '{colors.gray.1}' } },
        'widget-selector-background': { value: { base: '{colors.gray.2}' } },
        'widget-selector-hover-background': {
          value: { base: '{colors.gray.3}' }
        },
        'widget-swap-currency-button-border-color': {
          value: { base: '{colors.primary4}' }
        },

        // Modal
        'modal-background': {
          value: { base: 'white', _dark: '{colors.gray.1}' }
        },

        // Skeleton
        'skeleton-background': { value: { base: '{colors.gray.3}' } }
      },
      radii: {
        'widget-border-radius': { value: { base: '16px' } },
        'widget-card-border-radius': { value: '12px' },
        'modal-border-radius': { value: { base: '16px' } },
        'input-border-radius': { value: { base: '8px' } },
        'dropdown-border-radius': { value: { base: '8px' } },
        'widget-swap-currency-button-border-radius': { value: { base: '8px' } }
      },
      borders: {
        'widget-border': { value: { base: '0px solid white' } },
        'modal-border': { value: { base: '0px solid white' } },
        'dropdown-border': { value: { base: '1px solid {colors.gray5}' } },
        'widget-swap-currency-button-border-width': {
          value: { base: '2px' }
        },
        'widget-card-border': {
          value: { base: '1px solid {colors.primary4}' }
        }
      },
      shadows: {
        'widget-box-shadow': {
          value: { base: '0px 4px 30px rgba(0, 0, 0, 0.10)' }
        }
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
      'pulse-shadow': {
        '0%': { boxShadow: '0 0 0 0px currentColor' },
        '100%': { boxShadow: '0 0 0 6px currentColor' }
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
  layers: {
    base: 'panda_base',
    recipes: 'panda_recipes',
    reset: 'panda_reset',
    tokens: 'panda_tokens',
    utilities: 'panda_utilities'
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
