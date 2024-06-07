import {
  cva,
  css as designCss,
  type Styles
} from '@reservoir0x/relay-design-system/css'
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
      bold: { fontWeight: 700 },
      semi_bold: { fontWeight: 600 }
    }
  }
})

const Anchor: FC<
  AnchorHTMLAttributes<HTMLAnchorElement> & { css?: Styles }
> = ({ css, ...props }) => {
  return (
    <a
      {...props}
      className={designCss(AnchorStyle.raw(), designCss.raw(css))}
    ></a>
  )
}

export const AnchorButton: FC<
  ButtonHTMLAttributes<HTMLButtonElement> & { css?: Styles }
> = ({ css, children, ...props }) => {
  return (
    <button
      {...props}
      className={designCss(AnchorStyle.raw(), designCss.raw(css))}
    >
      {children}
    </button>
  )
}

export default Anchor
