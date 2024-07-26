import React from 'react'
import type { Dispatch, FC, SetStateAction } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { TabsList, TabsTrigger } from '../../primitives/Tabs.js'
import { Flex } from '../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt, faShuffle } from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'
import { EventNames } from '../../../constants/events.js'
import { token } from '@reservoir0x/relay-design-system/tokens'

export type BridgeType = 'relay' | 'canonical'

type BridgeTypeSelectorProps = {
  bridgeType: BridgeType
  setBridgeType: Dispatch<SetStateAction<BridgeType>>
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

export const BridgeTypeSelector: FC<BridgeTypeSelectorProps> = ({
  bridgeType,
  setBridgeType,
  onAnalyticEvent
}) => {
  const tabs = [
    {
      value: 'relay',
      trigger: (
        <Flex
          align="center"
          justify="center"
          css={{ gap: '2', position: 'relative', zIndex: 3, color: 'gray12' }}
        >
          <Flex
            align="center"
            justify="center"
            css={{
              color: 'primary9',
              backgroundColor: 'primary3',
              width: 24,
              height: 24,
              borderRadius: 8,
              '--borderColor': 'colors.neutralBg',
              border: '1px solid var(--borderColor)'
            }}
          >
            <FontAwesomeIcon icon={faBolt} width={12} />
          </Flex>
          Relay
        </Flex>
      )
    },
    {
      value: 'canonical',
      trigger: (
        <Flex
          align="center"
          justify="center"
          css={{ gap: '2', position: 'relative', zIndex: 3, color: 'gray12' }}
        >
          <Flex
            align="center"
            justify="center"
            css={{
              color: 'white',
              backgroundColor: 'gray8',
              width: 24,
              height: 24,
              borderRadius: 8,
              '--borderColor': 'colors.neutralBg',
              border: '1px solid var(--borderColor)'
            }}
          >
            <FontAwesomeIcon icon={faShuffle} width={12} />
          </Flex>
          Bridge
        </Flex>
      )
    }
  ]

  return (
    <Tabs.Root
      value={bridgeType}
      onValueChange={(value) => {
        setBridgeType(value as BridgeType)
        onAnalyticEvent?.(EventNames.BRIDGE_TYPE_SET, {
          bridge_type: value
        })
      }}
      style={{ width: '100%' }}
    >
      <TabsList>
        {tabs.map((tab) => {
          const isActiveTab = bridgeType === tab.value
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
                    backgroundColor: token('colors.modal-background'),
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
