import { cva } from '@reservoir0x/relay-design-system/css'

const Button = cva({
  base: {
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'body',
    fontWeight: 700,
    fontSize: 16,
    transition: 'background-color 250ms linear',
    gap: '2',
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: '20px',
    '--focusColor': 'colors.primary6',
    _focusVisible: {
      boxShadow: '0 0 0 2px var(--focusColor)'
    },
    _disabled: {
      cursor: 'not-allowed',
      backgroundColor: 'gray8',
      color: 'gray11',
      _hover: {
        backgroundColor: 'gray8',
        color: 'gray11'
      }
    }
  },
  variants: {
    color: {
      primary: {
        backgroundColor: 'primary9',
        color: 'white',
        '&:hover': {
          backgroundColor: 'primary10'
        }
      },
      secondary: {
        backgroundColor: 'primary3',
        color: 'primary11',
        '&:hover': {
          backgroundColor: 'primary4'
        }
      },
      light: {
        color: 'primary11',
        backgroundColor: 'gray1',
        '&:hover': {
          backgroundColor: 'primary2'
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        p: 0
      },
      white: {
        '--borderColor': 'colors.gray5',
        backgroundColor: 'neutralBg',
        '&:hover': {
          backgroundColor: 'gray2'
        },
        border: '1px solid var(--borderColor)'
      }
    },
    corners: {
      square: {
        borderRadius: 0
      },
      rounded: {
        borderRadius: 8
      },
      pill: {
        borderRadius: 99999
      },
      circle: {
        borderRadius: '99999px',
        alignItems: 'center',
        justifyContent: 'center'
      }
    },
    size: {
      none: {},
      xs: {
        p: '3',
        lineHeight: '16px',
        minHeight: 40
      },
      small: {
        px: '3',
        py: '2',
        lineHeight: '12px',
        minHeight: 40
      },
      medium: {
        px: '5',
        py: '3',
        minHeight: 44
      },
      large: {
        px: '5',
        py: '4',
        minHeight: 52
      }
    }
  },
  defaultVariants: {
    color: 'primary',
    corners: 'rounded',
    size: 'medium'
  }
})

export default Button
