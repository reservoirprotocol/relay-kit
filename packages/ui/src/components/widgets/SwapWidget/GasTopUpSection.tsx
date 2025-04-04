import { ASSETS_RELAY_API, type RelayChain } from '@reservoir0x/relay-sdk'
import type { FC } from 'react'
import {
  ChainTokenIcon,
  Flex,
  Text,
  StyledSwitch,
  StyledThumb
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

  if (!currency || !gasTopUpRequired) {
    return null
  }

  return (
    <Flex
      direction="column"
      css={{
        p: '3',
        gap: '2',
        backgroundColor: 'widget-background',
        borderRadius: '12px',
        mb: '1'
      }}
    >
      <Flex justify="between" align="center">
        <Flex css={{ gap: '2' }} align="center">
          <ChainTokenIcon
            css={{ width: 24, height: 24 }}
            chainId={toChain?.id}
            tokenlogoURI={`${ASSETS_RELAY_API}/icons/currencies/${
              currency?.id ?? currency?.symbol?.toLowerCase()
            }.png`}
          />
          <Text style="subtitle2">{toChain?.displayName} gas top up</Text>
        </Flex>
        <Flex align="center" css={{ gap: '1' }}>
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
          <Text style="subtitle2" color="subtle">
            You’re low on {toChain?.displayName} gas ({toChain?.displayName}{' '}
            {currency.symbol}). Top up to cover future transactions on{' '}
            {toChain?.displayName}.
          </Text>
        </CollapsibleContent>
      </CollapsibleRoot>
    </Flex>
  )
}

export default GasTopUpSection
