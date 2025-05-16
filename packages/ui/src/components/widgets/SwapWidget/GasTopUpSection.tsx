import { type RelayChain } from '@reservoir0x/relay-sdk'
import type { FC } from 'react'
import {
  Flex,
  Text,
  StyledSwitch,
  StyledThumb,
  ChainIcon
} from '../../primitives/index.js'
import {
  CollapsibleContent,
  CollapsibleRoot
} from '../../primitives/Collapsible.js'
import { formatDollar, formatBN } from '../../../utils/numbers.js'

type Props = {
  toChain?: RelayChain
  gasTopUpEnabled: boolean
  onGasTopUpEnabled: (enabled: boolean) => void
  gasTopUpRequired: boolean
  gasTopUpAmount?: bigint
  gasTopUpAmountUsd?: string
}

const GasTopUpSection: FC<Props> = ({
  toChain,
  gasTopUpEnabled,
  onGasTopUpEnabled,
  gasTopUpRequired,
  gasTopUpAmount,
  gasTopUpAmountUsd
}) => {
  const currency = toChain?.currency
  const gasTokenIsSupported = toChain?.currency?.supportsBridging

  if (!currency || !gasTopUpRequired || !gasTokenIsSupported) {
    return null
  }

  return (
    <Flex
      direction="column"
      css={{
        p: '3',
        backgroundColor: 'widget-background',
        border: 'widget-card-border',
        borderRadius: '12px',
        mb: 'widget-card-section-gutter'
      }}
    >
      <Flex justify="between" align="center">
        <Flex css={{ gap: '2', minWidth: 0 }} align="center">
          <ChainIcon height={24} width={24} square chainId={toChain?.id} />
          <Text ellipsify style="subtitle2" css={{ mr: '1' }}>
            {toChain?.displayName} gas top up
          </Text>
        </Flex>
        <Flex align="center" css={{ gap: '1', flexShrink: 0 }}>
          {gasTopUpEnabled ? (
            <>
              <Text style="subtitle2">
                {gasTopUpAmountUsd ? formatDollar(+gasTopUpAmountUsd) : '-'}
              </Text>
              <Text style="subtitle2" color="subtle">
                (
                {gasTopUpAmount
                  ? formatBN(gasTopUpAmount, 5, currency.decimals ?? 18)
                  : '-'}{' '}
                {currency.symbol})
              </Text>
            </>
          ) : null}
          <StyledSwitch
            checked={gasTopUpEnabled}
            onCheckedChange={onGasTopUpEnabled}
          >
            <StyledThumb />
          </StyledSwitch>
        </Flex>
      </Flex>
      <CollapsibleRoot open={gasTopUpEnabled}>
        <CollapsibleContent>
          <Text style="subtitle2" color="subtle" css={{ pt: '2' }}>
            Add {gasTopUpAmountUsd ? formatDollar(+gasTopUpAmountUsd) : 'funds'}
            to this swap to cover future transactions on {toChain?.displayName}.
          </Text>
        </CollapsibleContent>
      </CollapsibleRoot>
    </Flex>
  )
}

export default GasTopUpSection
