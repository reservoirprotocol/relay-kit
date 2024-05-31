import { FC } from 'react'
import { Button, ChainIcon, Flex, Text } from '../../../primitives'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { LoadingSpinner } from '../../LoadingSpinner'
import { RelayChain } from '@reservoir0x/relay-sdk'
import { Currency } from '../../../../lib/constants/currencies'
import { calculateTotalAmount } from '../../../../lib/utils/quote'

type BridgeConfirmationStepProps = {
  toChain: RelayChain
  fromChain: RelayChain
  currency: Currency
  totalAmount?: ReturnType<typeof calculateTotalAmount>
}

export const BridgeConfirmationStep: FC<BridgeConfirmationStepProps> = ({
  toChain,
  fromChain,
  currency,
  totalAmount
}) => {
  return (
    <>
      <Flex
        align="center"
        justify="between"
        direction="column"
        css={{ bp500: { flexDirection: 'row' } }}
      >
        <Flex
          direction="column"
          css={{
            backgroundColor: 'gray1',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Text style="subtitle2" color="subtle">
            From
          </Text>
          <Flex align="center" css={{ gap: '2', cursor: 'pointer' }}>
            <ChainIcon chainId={fromChain.id} css={{ height: 20, width: 20 }} />
            <Text maxWidth={100} style="subtitle1" ellipsify>
              {fromChain.displayName}
            </Text>
          </Flex>
        </Flex>
        <Text
          style="body1"
          css={{
            color: 'gray9',
            p: '0 16px',
            bp400Down: { transform: 'rotate(90deg)' }
          }}
        >
          <FontAwesomeIcon icon={faArrowRight} width={16} />
        </Text>
        <Flex
          direction="column"
          css={{
            backgroundColor: 'gray1',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Text style="subtitle2" color="subtle">
            To
          </Text>
          <Flex align="center" css={{ gap: '2', cursor: 'pointer' }}>
            <ChainIcon chainId={toChain.id} css={{ height: 20, width: 20 }} />
            <Text maxWidth={100} style="subtitle1" ellipsify>
              {toChain.displayName}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex align="center" justify="between">
        <Text style="subtitle1">Total:</Text>
        <Text style="h6">
          {totalAmount?.formattedExcludingOriginGas} {currency.symbol}
        </Text>
      </Flex>
      <Button
        disabled={true}
        css={{
          color: 'gray12 !important',
          mt: 8,
          justifyContent: 'center'
        }}
      >
        <LoadingSpinner css={{ height: 16, width: 16, fill: 'gray12' }} />
        Waiting for Wallet Confirmation
      </Button>
    </>
  )
}
