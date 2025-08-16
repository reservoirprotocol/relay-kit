import * as Collapsible from '@radix-ui/react-collapsible'
import {
  cva,
  css as designCss,
  type Styles
} from '@relayprotocol/relay-design-system/css'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type PropsWithChildren
} from 'react'

const CollapsibleContentCss = cva({
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

const CollapsibleRootCss = cva({
  base: {
    width: '100%'
  }
})

const CollapsibleTriggerCss = cva({
  base: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  }
})

const CollapsibleContent = forwardRef<
  ElementRef<typeof Collapsible.CollapsibleContent>,
  ComponentPropsWithoutRef<typeof Collapsible.CollapsibleContent> &
    PropsWithChildren & { css?: Styles }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <Collapsible.CollapsibleContent
      ref={forwardedRef}
      {...props}
      className={designCss(CollapsibleContentCss.raw(), designCss.raw(css))}
    >
      {children}
    </Collapsible.CollapsibleContent>
  )
})

const CollapsibleRoot = forwardRef<
  ElementRef<typeof Collapsible.Root>,
  ComponentPropsWithoutRef<typeof Collapsible.Root> &
    PropsWithChildren & { css?: Styles }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <Collapsible.Root
      ref={forwardedRef}
      {...props}
      className={designCss(CollapsibleRootCss.raw(), designCss.raw(css))}
    >
      {children}
    </Collapsible.Root>
  )
})

const CollapsibleTrigger = forwardRef<
  ElementRef<typeof Collapsible.Trigger>,
  ComponentPropsWithoutRef<typeof Collapsible.Trigger> &
    PropsWithChildren & { css?: Styles }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <Collapsible.Trigger
      ref={forwardedRef}
      {...props}
      className={designCss(CollapsibleTriggerCss.raw(), designCss.raw(css))}
    >
      {children}
    </Collapsible.Trigger>
  )
})

export { CollapsibleRoot, CollapsibleContent, CollapsibleTrigger }
