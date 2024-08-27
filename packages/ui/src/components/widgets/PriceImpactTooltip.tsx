import type { FC, ReactNode } from 'react'
import { Flex, Text, Box } from '../primitives/index.js'
import Tooltip from '../primitives/Tooltip.js'
import type { ChildrenProps } from '../widgets/SwapWidgetRenderer.js'

type PriceImpactTooltipProps = {
  feeBreakdown: ChildrenProps['feeBreakdown']
  children: ReactNode
  tooltipProps?: any
}

export const PriceImpactTooltip: FC<PriceImpactTooltipProps> = ({
  feeBreakdown,
  children,
  tooltipProps
}) => {
  return (
    <Tooltip
      content={
        <Flex css={{ minWidth: 200 }} direction="column">
          <Flex align="center" css={{ width: '100%' }}>
            <Text style="subtitle3" css={{ mr: 'auto' }}>
              Total Price Impact{' '}
            </Text>
            <Text style="subtitle3" css={{ mr: '1', ml: '2' }}>
              {feeBreakdown?.totalFees.priceImpact}
            </Text>
            <Text
              style="subtitle3"
              color={feeBreakdown?.totalFees?.priceImpactColor}
            >
              ({feeBreakdown?.totalFees.priceImpactPercentage})
            </Text>
          </Flex>
          <Box
            css={{
              width: '100%',
              height: 1,
              backgroundColor: 'slate.6',
              marginTop: '2',
              marginBottom: '2'
            }}
          />
          <Flex align="center" css={{ width: '100%' }}>
            <Text style="subtitle3" color="subtle" css={{ mr: 'auto' }}>
              Swap Impact
            </Text>
            <Text style="subtitle3">{feeBreakdown?.totalFees.swapImpact}</Text>
          </Flex>
          {feeBreakdown?.breakdown.map((fee) => {
            if (fee.id === 'origin-gas') {
              return null
            }
            return (
              <Flex key={fee.id} align="center" css={{ width: '100%' }}>
                <Text style="subtitle3" color="subtle" css={{ mr: 'auto' }}>
                  {fee.name}
                </Text>
                <Text style="subtitle3">{fee.usd}</Text>
              </Flex>
            )
          })}
        </Flex>
      }
      {...tooltipProps}
    >
      {children}
    </Tooltip>
  )
}
