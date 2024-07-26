import React from 'react'
import type { FC } from 'react'
import { Flex, Text } from '../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGasPump, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import Tooltip from '../../primitives/Tooltip.js'
import type { BridgeFee } from '../../../types/BridgeFee.js'

type Props = {
  feeBreakdown?: BridgeFee[] | null
}

export const FeeBreakdown: FC<Props> = ({ feeBreakdown }) => {
  if (!feeBreakdown) {
    return null
  }

  return (
    <Flex direction="column" css={{ gap: '2', paddingTop: '2' }}>
      {feeBreakdown.map((fee, i) => {
        return (
          <Flex key={`${fee.name}_${i}`} align="start" justify="between">
            <Text style="subtitle2" color="subtle">
              {fee.name}{' '}
              {fee.tooltip ? (
                <Tooltip content={<Text style="subtitle3">{fee.tooltip}</Text>}>
                  <FontAwesomeIcon
                    style={{ marginLeft: 6 }}
                    icon={faInfoCircle}
                  />
                </Tooltip>
              ) : null}
            </Text>
            <Flex align="center" css={{ gap: '2' }}>
              {fee.id === 'origin-gas' ? (
                <FontAwesomeIcon
                  icon={faGasPump}
                  width={16}
                  style={{ color: '#C1C8CD' }}
                />
              ) : null}
              <Text style="body2" color="subtle">
                {fee.formatted?.includes('<')
                  ? fee.formatted
                  : `${fee.formatted}`}{' '}
                {fee.currency?.symbol}
              </Text>
              <Text style="subtitle2">{fee.usd}</Text>
            </Flex>
          </Flex>
        )
      })}
    </Flex>
  )
}
