import type { FC } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { TabsList, TabsTrigger } from '../primitives/Tabs.js'
import { Flex } from '../primitives/index.js'
import { motion } from 'framer-motion'
import { token } from '@reservoir0x/relay-design-system/tokens'

export type WidgetTabId = 'deposit' | 'withdraw'

type WidgetTabsSelectorProps = {
  tabId: WidgetTabId
  setTabId: (tabId: WidgetTabId) => void
}

const WidgetTabs: FC<WidgetTabsSelectorProps> = ({ tabId, setTabId }) => {
  const tabs = [
    {
      value: 'deposit',
      trigger: (
        <Flex
          align="center"
          justify="center"
          css={{ gap: '2', position: 'relative', zIndex: 3, color: 'gray12' }}
        >
          Deposit
        </Flex>
      )
    },
    {
      value: 'withdraw',
      trigger: (
        <Flex
          align="center"
          justify="center"
          css={{ gap: '2', position: 'relative', zIndex: 3, color: 'gray12' }}
        >
          Withdraw
        </Flex>
      )
    }
  ]

  return (
    <Tabs.Root
      value={tabId}
      onValueChange={(value: any) => {
        setTabId(value as WidgetTabId)
      }}
      style={{ width: '100%' }}
    >
      <TabsList css={{ mb: '3' }}>
        {tabs.map((tab) => {
          const isActiveTab = tabId === tab.value
          console.log(tabId, tab.value, 'isActive', isActiveTab)
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              css={{
                position: 'relative',
                zIndex: isActiveTab ? 1 : 2
              }}
            >
              {tab.trigger}
              {isActiveTab ? (
                <motion.span
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: token('colors.widget-background'),
                    zIndex: -10,
                    borderRadius: 12
                  }}
                />
              ) : null}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs.Root>
  )
}

export default WidgetTabs
