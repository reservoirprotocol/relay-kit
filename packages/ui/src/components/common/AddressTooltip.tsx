import type { FC } from 'react'
import type { Address } from 'viem'
import Tooltip from '../primitives/Tooltip.js'
import { Text } from '../primitives/index.js'
import { truncateAddress } from '../../utils/truncate.js'

type AddressTooltipProps = {
  address: Address
}

export const AddressTooltip: FC<AddressTooltipProps> = ({ address }) => {
  return (
    <Tooltip content={address}>
      <Text
        style="subtitle2"
        css={{ color: 'primary11', display: 'inline-block' }}
      >
        {truncateAddress(address)}
      </Text>
    </Tooltip>
  )
}
