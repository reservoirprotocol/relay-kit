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

type SwapWidgetTokenTriggerProps = {
  token?: Token
  locked?: boolean
}

export const SwapWidgetTokenTrigger: FC<SwapWidgetTokenTriggerProps> = ({
  token,
  locked
}) => {
  return token ? (
    <Button
      color="white"
      corners="pill"
      disabled={locked}
      css={{
        height: 36,
        minHeight: 36,
        width: 'max-content',
        flexShrink: 0,
        overflow: 'hidden',
        px: '3',
        py: '2',
        backgroundColor: 'gray2',
        border: 'none',
        _hover: {
          backgroundColor: 'gray3'
        },
        _disabled: {
          backgroundColor: 'gray2'
        }
      }}
    >
      <Flex align="center" css={{ gap: '2' }}>
        <img
          alt={token.name}
          src={token.logoURI}
          width={20}
          height={20}
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
      color="white"
      corners="pill"
      css={{
        height: 36,
        minHeight: 36,
        width: 'max-content',
        flexShrink: 0,
        overflow: 'hidden',
        px: '3',
        py: '2',
        backgroundColor: 'gray2',
        border: 'none',
        _hover: {
          backgroundColor: 'gray3'
        }
      }}
    >
      Select Token
      <Box css={{ color: 'gray9', width: 14 }}>
        <FontAwesomeIcon icon={faChevronDown} width={14} />
      </Box>
    </Button>
  )
}
