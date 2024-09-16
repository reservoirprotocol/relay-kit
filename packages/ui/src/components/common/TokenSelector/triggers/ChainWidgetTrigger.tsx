import type { FC } from 'react'
import type { Token } from '../../../../types/index.js'
import {
  Button,
  Flex,
  Text,
  Box
} from '../../../../components/primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

type ChainWidgetTriggerProps = {
  token?: Token
  locked?: boolean
}

export const ChainWidgetTrigger: FC<ChainWidgetTriggerProps> = ({
  token,
  locked
}) => {
  return token ? (
    <Button
      color="white"
      corners="pill"
      disabled={locked}
      css={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '3',
        height: 46,
        width: 'max-content',
        maxWidth: 162,
        flexShrink: 0,
        overflow: 'hidden',
        _disabled: {
          backgroundColor: 'transparent',
          border: 'none',
          px: 0,
          _hover: {
            backgroundColor: 'transparent',
            filter: 'none'
          }
        }
      }}
    >
      <Flex align="center" css={{ gap: '2' }}>
        <img
          alt={token.name}
          src={token.logoURI}
          width={30}
          height={30}
          style={{
            borderRadius: 9999
          }}
        />
        <Text style="subtitle1" ellipsify>
          {token.symbol}
        </Text>
      </Flex>
      {locked ? null : (
        <Box css={{ color: 'gray11', width: 14, flexShrink: 0 }}>
          <FontAwesomeIcon icon={faChevronDown} width={14} />
        </Box>
      )}
    </Button>
  ) : (
    <Button
      color="primary"
      corners="pill"
      css={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
        px: '3',
        height: 46,
        maxWidth: 162,
        width: 'max-content',
        flexShrink: 0,
        fontWeight: 500
      }}
    >
      Select Token
      <Box css={{ color: 'white', width: 14 }}>
        <FontAwesomeIcon icon={faChevronDown} width={14} />
      </Box>
    </Button>
  )
}
