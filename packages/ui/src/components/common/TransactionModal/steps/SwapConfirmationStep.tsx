import { type FC } from 'react'
import { Flex, Text, ChainTokenIcon } from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type Token } from '../../../../types/index.js'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'
import type { useQuote } from '@reservoir0x/relay-kit-hooks'
import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'

type SwapConfirmationStepProps = {
  fromToken?: Token
  toToken?: Token
  fromChain?: RelayChain
  toChain?: RelayChain
  fromAmountFormatted: string
  toAmountFormatted: string
  quote?: ReturnType<typeof useQuote>['data']
  steps: Execute['steps'] | null
}

export const SwapConfirmationStep: FC<SwapConfirmationStepProps> = ({
  fromToken,
  toToken,
  fromChain,
  toChain,
  fromAmountFormatted,
  toAmountFormatted,
  quote,
  steps
}) => {
  return (
    <>
      <Flex
        align="center"
        justify="between"
        direction="column"
        css={{ flexShrink: 0, bp500: { flexDirection: 'row' } }}
      >
        <Flex
          direction="column"
          css={{
            backgroundColor: 'subtle-background-color',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Flex direction="column" align="start" css={{ gap: '1' }}>
            <ChainTokenIcon
              chainId={fromToken?.chainId}
              tokenlogoURI={fromToken?.logoURI}
              css={{ height: 32, width: 32 }}
            />
            <Text color="subtle" style="subtitle2">
              {fromChain?.displayName}
            </Text>
            <Text style="h6" ellipsify css={{ lineHeight: '20px' }}>
              {fromAmountFormatted} {fromToken?.symbol}
            </Text>
          </Flex>
        </Flex>
        <Text
          style="body1"
          css={{
            color: 'gray9',
            p: '0 12px',
            bp400Down: { transform: 'rotate(90deg)' }
          }}
        >
          <FontAwesomeIcon icon={faArrowRight} width={16} />
        </Text>
        <Flex
          direction="column"
          css={{
            backgroundColor: 'subtle-background-color',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Flex direction="column" align="start" css={{ gap: '1' }}>
            <ChainTokenIcon
              chainId={toToken?.chainId}
              tokenlogoURI={toToken?.logoURI}
              css={{ height: 32, width: 32 }}
            />
            <Text color="subtle" style="subtitle2">
              {toChain?.displayName}
            </Text>
            <Text style="h6" ellipsify css={{ lineHeight: '20px' }}>
              {toAmountFormatted} {toToken?.symbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        direction="column"
        css={{
          '--borderColor': 'colors.gray3',
          border: '1px solid var(--borderColor)',
          borderRadius: 12,
          px: '3',
          py: '2',
          gap: '8px'
        }}
      ></Flex>
    </>
  )
}
