import { FC } from 'react'
import { Address } from 'viem'
import Tooltip from '../primitives/Tooltip'
import { Text } from '../primitives'
import { truncateAddress } from '../../utils/truncate'

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
