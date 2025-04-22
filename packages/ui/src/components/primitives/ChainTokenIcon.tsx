import { type FC } from 'react'
import Flex from './Flex.js'
import ChainIcon from './ChainIcon.js'
import Box from './Box.js'
import type { Styles } from '@reservoir0x/relay-design-system/css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoins } from '@fortawesome/free-solid-svg-icons'

type Size = 'md' | 'lg'

type ChainTokenProps = {
  chainId?: number
  tokenlogoURI?: string
  css?: Styles
  size?: Size
}

const SIZES = {
  md: {
    token: 32,
    chain: 16
  },
  lg: {
    token: 40,
    chain: 18
  }
} as const

export const ChainTokenIcon: FC<ChainTokenProps> = ({
  chainId,
  tokenlogoURI,
  css = {},
  size = 'md'
}) => {
  const isValidTokenLogo = tokenlogoURI && tokenlogoURI !== 'missing.png'
  const dimensions = SIZES[size]

  return chainId ? (
    <Flex css={{ position: 'relative', flexShrink: 0, ...css }}>
      {isValidTokenLogo ? (
        <img
          alt={'Token'}
          src={tokenlogoURI}
          width={dimensions.token}
          height={dimensions.token}
          style={{
            borderRadius: 9999,
            overflow: 'hidden'
          }}
        />
      ) : (
        <Box
          css={{
            width: dimensions.token,
            height: dimensions.token,
            borderRadius: '50%',
            backgroundColor: 'primary4',
            color: 'primary8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon
            icon={faCoins}
            width={dimensions.token / 2}
            height={dimensions.token / 2}
          />
        </Box>
      )}
      <ChainIcon
        chainId={chainId}
        width={dimensions.chain}
        height={dimensions.chain}
        css={{
          position: 'absolute',
          right: 0,
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
