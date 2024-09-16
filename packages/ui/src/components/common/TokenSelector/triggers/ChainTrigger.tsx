import type { FC } from 'react'
import type { Token } from '../../../../types/index.js'
import {
  Box,
  Button,
  ChainIcon,
  Flex,
  Text
} from '../../../../components/primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { RelayChain } from '@reservoir0x/relay-sdk'

type ChainTriggerProps = {
  token?: Token
  chain?: RelayChain
  onClick?: () => void
}

export const ChainTrigger: FC<ChainTriggerProps> = ({
  token,
  chain,
  onClick
}) => {
  return (
    <Button
      onClick={onClick}
      css={{
        justifyContent: 'space-between',
        alignItems: 'center',
        py: '3',
        px: '3',
        borderRadius: '8px',
        width: '100%',
        height: 48,
        backgroundColor: 'gray2',
        _hover: {
          backgroundColor: 'gray3'
        }
      }}
    >
      {token ? (
        <Flex align="center" css={{ gap: '2' }}>
          <ChainIcon chainId={token?.chainId} width={24} height={24} />
          <Text style="h6">{chain?.displayName}</Text>
        </Flex>
      ) : (
        <Text style="h6">Select Chain</Text>
      )}
      <Box css={{ color: 'gray9' }}>
        <FontAwesomeIcon icon={faChevronDown} width={14} />
      </Box>
    </Button>
  )
}
