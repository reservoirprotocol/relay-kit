import { type FC } from 'react'
import { Flex } from './index.js'
import useRelayClient from '../../hooks/useRelayClient.js'
import type { Styles } from '@reservoir0x/relay-design-system/css'

type Props = {
  chainId?: number
  height?: number
  width?: number
  css?: Styles
  square?: boolean
}

const ChainIcon: FC<Props> = ({
  chainId,
  css = {},
  height = 14,
  width = 14,
  square = true
}) => {
  const client = useRelayClient()
  const icon = chainId
    ? client?.chains?.find((chain) => chain.id === chainId)?.icon?.light
    : null

  const iconUrl = square ? icon?.replace('/icons/', '/icons/square/') : icon

  return iconUrl ? (
    <Flex
      css={{
        display: 'flex',
        flexShrink: 0,
        ...css
      }}
      style={{
        height: height,
        width: width
      }}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={`Chain #${chainId}`}
          style={{
            borderRadius: square ? 4 : 0,
            width: css && css.width ? Number(css.width) : '100%',
            height: css && css.height ? Number(css.height) : '100%'
          }}
        />
      ) : null}
    </Flex>
  ) : null
}

export default ChainIcon
