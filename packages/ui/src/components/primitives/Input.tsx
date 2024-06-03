import Flex from './Flex'
import type { FC, HTMLProps, PropsWithChildren, ReactNode } from 'react'
import {
  cva,
  css as designCss,
  type Styles
} from '@reservoir0x/relay-design-system/css'
import Box from './Box'

const StyledInputCss = cva({
  base: {
    px: 16,
    py: 12,
    borderRadius: 8,
    fontFamily: 'body',
    fontSize: 16,
    color: 'gray12',
    backgroundColor: 'gray3',
    _placeholder: {
      color: 'gray10'
    },
    '--focusColor': 'colors.primary11',
    _focus: {
      boxShadow: '0 0 0 2px var(--focusColor)',
      outline: 'none'
    },
    _disabled: {
      cursor: 'not-allowed'
    },
    _spinButtons: {
      WebkitAppearance: 'none'
    }
  },

  variants: {
    size: {
      large: {
        fontSize: 32,
        lineHeight: '42px'
      }
    },
    ellipsify: {
      true: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    }
  }
})

type StyledInputCssVariants = NonNullable<
  Parameters<(typeof StyledInputCss)['raw']>['0']
>

const Input: FC<
  Omit<HTMLProps<HTMLInputElement>, 'size'> &
    PropsWithChildren & {
      icon?: ReactNode
      iconPosition?: 'left' | 'right'
      iconCss?: Styles
      containerCss?: Styles
    } & { css?: Styles } & StyledInputCssVariants
> = ({
  children,
  icon,
  iconPosition,
  iconCss,
  containerCss,
  css,
  ...props
}) => {
  const { size, ellipsify, ...inputProps } = props
  return (
    <Flex
      css={{
        ...containerCss
      }}
    >
      {icon && (
        <Flex css={{ position: icon ? 'relative' : 'inherit' }}>
          <Box
            css={{
              position: 'absolute',
              top: 12,
              left: iconPosition === 'right' ? 'unset' : 16,
              right: iconPosition === 'right' ? 16 : 'unset',
              zIndex: 0,
              ...iconCss
            }}
          >
            {icon}
          </Box>
        </Flex>
      )}
      <input
        className={designCss(css, StyledInputCss.raw({ size, ellipsify }), {
          paddingLeft: icon && iconPosition !== 'right' ? 42 : 16,
          paddingRight: icon && iconPosition === 'right' ? 42 : 16
        })}
        {...inputProps}
      />
    </Flex>
  )
}

Input.displayName = 'Input'

export default Input
