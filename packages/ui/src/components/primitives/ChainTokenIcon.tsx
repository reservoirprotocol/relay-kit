import { type FC } from 'react'
import Flex from './Flex.js'
import ChainIcon from './ChainIcon.js'
import type { Styles } from '@reservoir0x/relay-design-system/css'

type ChainTokenProps = {
  chainId?: number
  tokenlogoURI?: string
  css?: Styles
}

export const ChainTokenIcon: FC<ChainTokenProps> = ({
  chainId,
  tokenlogoURI,
  css = {}
}) => {
  return chainId && tokenlogoURI ? (
    <Flex css={{ position: 'relative', flexShrink: 0, ...css }}>
      <img
        alt={'Token'}
        src={tokenlogoURI}
        width={30}
        height={30}
        style={{
          borderRadius: 9999
        }}
      />
      <ChainIcon
        chainId={chainId}
        width={14}
        height={14}
        css={{
          position: 'absolute',
          right: -1,
          bottom: 0,
          borderRadius: 4,
          overflow: 'hidden',
          '--borderColor': 'colors.modal-background',
          border: '1px solid var(--borderColor)',
          backgroundColor: 'modal-background'
        }}
      />
    </Flex>
  ) : null
}
