import type { FC } from 'react'
import {
  AccessibleListItem,
  Button,
  ChainTokenIcon,
  Flex,
  Text
} from '../../primitives/index.js'
import { convertApiCurrencyToToken } from '../../../utils/tokens.js'
import { useMemo } from 'react'
import { type Currency } from '@reservoir0x/relay-kit-hooks'
import { useInternalRelayChains } from '../../../hooks/index.js'

type SuggestedTokensProps = {
  chainId: number
  depositAddressOnly?: boolean
  onSelect: (token: Currency) => void
}

export const SuggestedTokens: FC<SuggestedTokensProps> = ({
  chainId,
  depositAddressOnly,
  onSelect
}) => {
  const { chains } = useInternalRelayChains()

  const chain = chains?.find((c) => c.id === chainId)

  const suggestedTokens = useMemo(() => {
    if (!chain?.featuredTokens) return []

    return chain.featuredTokens
      .filter((token) => (depositAddressOnly ? token.supportsBridging : true))
      .map((currency) => {
        return {
          ...currency,
          chainId: Number(chainId),
          verified: true
        }
      })
  }, [chain?.featuredTokens, chainId, depositAddressOnly])

  if (!suggestedTokens.length) {
    return null
  }

  return (
    <Flex
      css={{
        width: '100%',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1',
        my: '2'
      }}
    >
      {suggestedTokens.map((token, idx) => (
        <AccessibleListItem
          asChild
          key={`${token.chainId}:${token.address}:${idx}`}
          value={`${token.chainId}:${token.address}`}
        >
          <Button
            onClick={(e) => {
              e.preventDefault()
              onSelect({
                ...token
              })
            }}
            color="ghost"
            size="none"
            css={{
              display: 'flex',
              flexShrink: 0,
              cursor: 'pointer',
              outline: 'none',
              p: '1',
              pr: '2',
              gap: 1,
              alignItems: 'center',
              maxWidth: 110,
              '--borderColor': 'colors.gray5',
              border: '1px solid var(--borderColor)',
              borderRadius: '100px',
              '--focusColor': 'colors.focus-color',
              _focusVisible: {
                boxShadow: 'inset 0 0 0 2px var(--focusColor)'
              },
              '&[data-state="on"]': {
                boxShadow: 'inset 0 0 0 2px var(--focusColor)'
              },
              _active: {
                boxShadow: 'inset 0 0 0 2px var(--focusColor)'
              },
              _focusWithin: {
                boxShadow: 'inset 0 0 0 2px var(--focusColor)'
              }
            }}
          >
            <ChainTokenIcon
              chainId={token.chainId}
              tokenlogoURI={token?.metadata?.logoURI}
              tokenSymbol={token.symbol}
            />
            <Text style="h6" ellipsify>
              {token.symbol}
            </Text>
          </Button>
        </AccessibleListItem>
      ))}
    </Flex>
  )
}
