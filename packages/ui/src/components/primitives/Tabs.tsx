import * as TabsPrimitive from '@radix-ui/react-tabs'
import {
  cva,
  css as designCss,
  type Styles
} from '@reservoir0x/relay-design-system/css'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef
} from 'react'

const TabsListCss = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 12,
    p: '1px',
    backgroundColor: 'gray3'
  }
})

const TabsTriggerCss = cva({
  base: {
    width: '100%',
    fontWeight: '500',
    cursor: 'pointer',
    p: '2',
    color: 'black',
    borderRadius: 12
  }
})

const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    css?: Styles
  }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <TabsPrimitive.List
      {...props}
      ref={forwardedRef}
      className={designCss(TabsListCss.raw(), designCss.raw(css))}
    >
      {children}
    </TabsPrimitive.List>
  )
})

const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    css?: Styles
  }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <TabsPrimitive.Trigger
      {...props}
      ref={forwardedRef}
      className={designCss(TabsTriggerCss.raw(), designCss.raw(css))}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
})

const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    css?: Styles
  }
>(({ children, css, ...props }, forwardedRef) => {
  return (
    <TabsPrimitive.Content
      {...props}
      ref={forwardedRef}
      className={designCss(designCss.raw(css))}
    >
      {children}
    </TabsPrimitive.Content>
  )
})

export { TabsList, TabsTrigger, TabsContent }
