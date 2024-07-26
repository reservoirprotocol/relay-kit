import type { FC } from 'react'
import { Flex } from './index.js'
import type { SystemStyleObject } from '@reservoir0x/relay-design-system/types'

type Props = {
  currencyId?: string
  height?: number
  width?: number
  css?: SystemStyleObject
}

const CurrencyIcon: FC<Props> = ({
  currencyId,
  css = {},
  height = 14,
  width = 14
}) => {
  const icon = currencyId
    ? `https://assets.relay.link/icons/currencies/${currencyId}.png`
    : null

  return icon ? (
    <Flex
      css={{
        display: 'flex',
        flexShrink: 0,
        height: height,
        width: width,
        ...css
      }}
    >
      {icon ? (
        <img
          src={icon}
          alt={`${currencyId}`}
          style={{ width: '100%', height: '100%' }}
          width={css.width ? Number(css.width) : 150}
          height={css.width ? Number(css.height) : 150}
        />
      ) : null}
    </Flex>
  ) : null
}

export default CurrencyIcon
