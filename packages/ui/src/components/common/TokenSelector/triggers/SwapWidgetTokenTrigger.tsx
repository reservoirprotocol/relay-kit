import type { FC } from 'react'
import type { Token } from '../../../../types/index.js'
import {
  Button,
  Flex,
  Text,
  Box,
  ChainTokenIcon
} from '../../../../components/primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCoins } from '@fortawesome/free-solid-svg-icons'

type SwapWidgetTokenTriggerProps = {
  token?: Token
  locked?: boolean
  isSingleChainLocked?: boolean
}

export const SwapWidgetTokenTrigger: FC<SwapWidgetTokenTriggerProps> = ({
  token,
  locked,
  isSingleChainLocked
}) => {
  const isValidTokenLogo = token?.logoURI && token.logoURI !== 'missing.png'

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
        backgroundColor: 'widget-selector-background',
        border: 'none',
        _hover: {
          backgroundColor: 'widget-selector-hover-background'
        },
        _disabled: {
          backgroundColor: 'widget-selector-background'
        }
      }}
    >
      <Flex align="center" css={{ gap: '2' }}>
        {isSingleChainLocked ? (
          <ChainTokenIcon
            chainId={token.chainId}
            tokenlogoURI={token.logoURI}
            css={{ width: 24, height: 24 }}
          />
        ) : isValidTokenLogo ? (
          <img
            alt={token.name}
            src={token.logoURI}
            width={20}
            height={20}
            style={{
              borderRadius: 9999
            }}
          />
        ) : (
          <Box
            css={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'primary4',
              color: 'primary8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon icon={faCoins} width={12} height={12} />
          </Box>
        )}
        <Text style="subtitle1" ellipsify css={{ maxWidth: 100 }}>
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
