import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { FC } from 'react'
import { Flex, Input, Text } from '../primitives/index.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import Tooltip from '../primitives/Tooltip.js'

type RefundAddressSectionProps = {
  fromChain?: RelayChain
  refundAddressValid?: boolean
  refundAddress?: string
  setRefundAddress: (address: string | undefined) => void
}

const RefundAddressSection: FC<RefundAddressSectionProps> = ({
  fromChain,
  refundAddressValid,
  refundAddress,
  setRefundAddress
}) => {
  return (
    <Flex
      direction="column"
      css={{
        borderRadius: 'widget-card-border-radius',
        backgroundColor: 'widget-background',
        overflow: 'hidden',
        mb: '6px',
        px: '4',
        py: '3',
        gap: '2'
      }}
    >
      <Tooltip
        content={
          <Text
            style="subtitle2"
            css={{ maxWidth: 215, display: 'inline-block' }}
          >
            If anything goes wrong during the process, we’ll issue a refund to
            this wallet.
          </Text>
        }
      >
        <div>
          <Flex align="center" css={{ color: 'gray8', gap: '1' }}>
            <Text style="subtitle2">Refund Address</Text>
            <FontAwesomeIcon
              icon={faInfoCircle}
              width={14}
              height={14}
              style={{
                display: 'inline-block',
                marginLeft: 4
              }}
            />
          </Flex>
        </div>
      </Tooltip>
      <Input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        className="ph-no-capture"
        css={{
          width: '100%',
          height: 44,
          color: refundAddress && !refundAddressValid ? 'red11' : undefined
        }}
        value={refundAddress}
        onChange={(e) => {
          setRefundAddress((e.target as HTMLInputElement).value)
        }}
        placeholder={`Enter ${fromChain?.displayName} wallet address for refund`}
      />
      {refundAddress && !refundAddressValid ? (
        <Text color="red" style="subtitle3">
          Invalid {fromChain?.displayName} address
        </Text>
      ) : null}
    </Flex>
  )
}

export default RefundAddressSection
