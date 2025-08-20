import React, { forwardRef, type FC } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import {
  cva,
  css as designCss,
  type Styles
} from '@relayprotocol/relay-design-system/css'

const AccessibleListContainerCss = cva({
  base: {
    display: 'flex',
    flexDirection: 'column'
  }
})

const AccessibleListItemCss = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    userSelect: 'none',
    cursor: 'pointer',
    '&[data-state=on]': {}
  }
})

type AccessibleListProps = {
  children: React.ReactNode
  onSelect: (value: string) => void
  css?: Styles
}

export const AccessibleList: FC<AccessibleListProps> = ({
  children,
  onSelect,
  css
}) => {
  return (
    <ToggleGroup.Root
      type="single"
      loop={false}
      onValueChange={onSelect}
      className={designCss(
        AccessibleListContainerCss.raw(),
        designCss.raw(css)
      )}
    >
      {children}
    </ToggleGroup.Root>
  )
}

type AccessibleListItemProps = {
  children: React.ReactNode
  value: string
  css?: Styles
  asChild?: boolean
}

export const AccessibleListItem = forwardRef<
  HTMLButtonElement,
  AccessibleListItemProps
>(({ children, value, css, asChild, ...props }, forwardedRef) => {
  return (
    <ToggleGroup.Item
      value={value}
      className={designCss(AccessibleListItemCss.raw(), designCss.raw(css))}
      asChild={asChild}
      {...props}
      ref={forwardedRef}
    >
      {children}
    </ToggleGroup.Item>
  )
})

AccessibleListItem.displayName = 'AccessibleListItem'
