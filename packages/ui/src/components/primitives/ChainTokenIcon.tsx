import { type FC } from 'react'
import Flex from './Flex.js'
import ChainIcon from './ChainIcon.js'
import Box from './Box.js'
import type { Styles } from '@reservoir0x/relay-design-system/css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoins } from '@fortawesome/free-solid-svg-icons'

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
  const isValidTokenLogo = tokenlogoURI && tokenlogoURI !== 'missing.png'

  return chainId ? (
    <Flex css={{ position: 'relative', flexShrink: 0, ...css }}>
      {isValidTokenLogo ? (
        <img
          alt={'Token'}
          src={tokenlogoURI}
          width={32}
          height={32}
          style={{
            borderRadius: 9999,
            overflow: 'hidden'
          }}
        />
      ) : (
        <Box
          css={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'gray2',
            color: 'gray9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faCoins} width={16} height={16} />
        </Box>
      )}
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
