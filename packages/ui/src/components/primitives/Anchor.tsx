import {
  cva,
  css as designCss,
  type Styles
} from '@relayprotocol/relay-design-system/css'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from 'react'

const AnchorStyle = cva({
  base: {
    cursor: 'pointer',
    width: 'max-content',
    fontWeight: 500,
    fontSize: 14,
    color: 'anchor-color',
    _hover: {
      color: 'anchor-hover-color'
    },
    '--focusColor': 'colors.focus-color',
    _focusVisible: {
      boxShadow: '0 0 0 2px var(--focusColor)',
      outline: 'none',
      borderRadius: '4px'
    }
  },
  variants: {
    color: {
      gray: {
        color: 'gray11',
        _hover: { color: 'gray12' }
      },
      base: {
        color: 'anchor-color',
        _hover: {
          color: 'anchor-hover-color'
        }
      },
      black: {
        color: 'gray12',
        _hover: {
          color: 'gray12'
        }
      }
    },
    weight: {
      heavy: { fontWeight: 900 },
      bold: { fontWeight: 700 },
      semi_bold: { fontWeight: 600 }
    }
  }
})

type AnchorCssProps = Parameters<typeof AnchorStyle>['0']

const Anchor: FC<
  AnchorHTMLAttributes<HTMLAnchorElement> & AnchorCssProps & { css?: Styles }
> = ({ css, weight, color, ...props }) => {
  return (
    <a
      {...props}
      className={designCss(
        AnchorStyle.raw({ weight, color }),
        designCss.raw(css)
      )}
    ></a>
  )
}

export const AnchorButton: FC<
  ButtonHTMLAttributes<HTMLButtonElement> & AnchorCssProps & { css?: Styles }
> = ({ css, weight, color, children, ...props }) => {
  return (
    <button
      {...props}
      className={designCss(
        AnchorStyle.raw({ weight, color }),
        designCss.raw(css)
      )}
    >
      {children}
    </button>
  )
}

export default Anchor
