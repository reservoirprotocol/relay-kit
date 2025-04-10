import * as Switch from '@radix-ui/react-switch'
import {
  cva,
  css as designCss,
  type Styles
} from '@reservoir0x/relay-design-system/css'
import {
  type ElementRef,
  forwardRef,
  type ComponentPropsWithoutRef
} from 'react'

const StyledSwitchCss = cva({
  base: {
    cursor: 'pointer',
    width: '38px',
    height: '20px',
    backgroundColor: 'gray7',
    borderRadius: '9999px',
    position: 'relative',
    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    transition: 'background-color 250ms',
    "&[data-state='checked']": {
      backgroundColor: 'primary-button-background'
    }
  }
})

export const StyledSwitch = forwardRef<
  ElementRef<typeof Switch.Root>,
  ComponentPropsWithoutRef<typeof Switch.Root> & { css?: Styles }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <Switch.Root
      ref={forwardedRef}
      {...props}
      className={designCss(StyledSwitchCss.raw(), designCss.raw(css))}
    >
      {children}
    </Switch.Root>
  )
})

const StyledThumbCss = cva({
  base: {
    display: 'block',
    width: '17.5px',
    height: '17.5px',
    backgroundColor: 'gray1',
    borderRadius: '9999px',
    zIndex: 1,
    '--borderColor': 'colors.primary7',
    border: '1px solid var(--borderColor)',
    transition: 'transform 100ms',
    transform: 'translateX(0px)',
    willChange: 'transform',
    position: 'absolute',
    left: '2px',
    "&[data-state='checked']": {
      transform: 'translateX(17px)'
    }
  }
})

export const StyledThumb = forwardRef<
  ElementRef<typeof Switch.Root>,
  ComponentPropsWithoutRef<typeof Switch.Root> & { css?: Styles }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <Switch.Thumb
      ref={forwardedRef}
      {...props}
      className={designCss(StyledThumbCss.raw(), designCss.raw(css))}
    />
  )
})
