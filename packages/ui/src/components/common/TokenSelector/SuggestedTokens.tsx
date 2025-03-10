import type { FC } from 'react'
import {
  AccessibleListItem,
  Button,
  ChainTokenIcon,
  Flex,
  Text
} from '../../primitives/index.js'
import type { Token } from '../../../types/index.js'
import { useRelayClient } from '../../../hooks/index.js'
import { convertApiCurrencyToToken } from '../../../utils/tokens.js'
import { useMemo } from 'react'
import ChainSuggestedTokens from '../../../constants/ChainSuggestedTokens.js'
import { type Currency } from '@reservoir0x/relay-kit-hooks'
import { zeroAddress } from 'viem'

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
  const client = useRelayClient()
  const chain = client?.chains.find((c) => c.id === chainId)
  const chainCurrency = chain?.currency

  // Convert native currency to token
  const nativeCurrency = convertApiCurrencyToToken(chainCurrency, chainId)

  // Filter and convert relevant ERC20 currencies to tokens
  const suggestedErc20Tokens = useMemo(() => {
    if (!chain?.erc20Currencies) return []

    return chain.erc20Currencies
      .filter(
        (currency) =>
          (currency.id?.toUpperCase().includes('USD') ||
            currency.id?.toUpperCase().includes('WETH')) &&
          (depositAddressOnly ? currency.supportsBridging : true)
      )
      .map((currency) => convertApiCurrencyToToken(currency, chainId))
  }, [chain?.erc20Currencies, chainId])

  // Get additional static suggested tokens for this chain
  const staticSuggestedTokens = !depositAddressOnly
    ? ChainSuggestedTokens[chainId] || []
    : []

  // Combine all tokens and remove duplicates
  const allSuggestedTokens = useMemo(() => {
    const uniqueTokens: Record<string, Token> = {}

    ;[
      depositAddressOnly || !chainCurrency?.supportsBridging
        ? undefined
        : nativeCurrency,
      ...suggestedErc20Tokens,
      ...staticSuggestedTokens
    ].forEach((token) => {
      if (token) {
        uniqueTokens[token.address] = token
      }
    })

    return Object.values(uniqueTokens).sort((a, b) => {
      const order: Record<string, number> = {
        ETH: 1,
        SOL: 1,
        USDC: 2,
        USDT: 3
      }
      const aOrder =
        a.address === zeroAddress
          ? -1
          : a.symbol && order[a.symbol]
            ? order[a.symbol]
            : 4
      const bOrder =
        b.address === zeroAddress
          ? -1
          : b.symbol && order[b.symbol]
            ? order[b.symbol]
            : 4
      return aOrder - bOrder || (a?.symbol ?? '').localeCompare(b?.symbol ?? '')
    })
  }, [nativeCurrency, suggestedErc20Tokens, staticSuggestedTokens])

  if (!allSuggestedTokens) {
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
      {allSuggestedTokens?.map((token) => (
        <AccessibleListItem
          asChild
          key={`${token.chainId}:${token.address}`}
          value={`${token.chainId}:${token.address}`}
        >
          <Button
            onClick={(e) => {
              e.preventDefault()
              onSelect({
                ...token,
                metadata: { logoURI: token.logoURI, verified: true }
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
              gap: 2,
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
              tokenlogoURI={token.logoURI}
              css={{
                width: 24,
                height: 24
              }}
            />
            <Text style="subtitle1" ellipsify>
              {token.symbol}
            </Text>
          </Button>
        </AccessibleListItem>
      ))}
    </Flex>
  )
}
