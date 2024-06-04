import * as Collapsible from '@radix-ui/react-collapsible'
import {
  cva,
  css as designCss,
  type Styles
} from '@reservoir0x/relay-design-system/css'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type PropsWithChildren
} from 'react'

const StyledCollapsibleContentCss = cva({
  base: {
    overflow: 'hidden',
    _data_state_open: {
      animation: `collapsibleSlideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)`
    },
    _data_state_closed: {
      animation: `collapsibleSlideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)`
    }
  }
})

export const StyledCollapsibleContent = forwardRef<
  ElementRef<typeof Collapsible.CollapsibleContent>,
  ComponentPropsWithoutRef<typeof Collapsible.CollapsibleContent> &
    PropsWithChildren & { css?: Styles }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <Collapsible.CollapsibleContent
      ref={forwardedRef}
      {...props}
      className={designCss(
        StyledCollapsibleContentCss.raw(),
        designCss.raw(css)
      )}
    >
      {children}
    </Collapsible.CollapsibleContent>
  )
})
