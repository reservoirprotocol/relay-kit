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
    color: 'primary11',
    _hover: {
      color: 'primary9'
    }
  },
  variants: {
    color: {
      gray: {
        color: 'gray11',
        _hover: { color: 'gray12' }
      },
      base: {
        color: 'primary11',
        _hover: {
          color: 'primary9'
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
