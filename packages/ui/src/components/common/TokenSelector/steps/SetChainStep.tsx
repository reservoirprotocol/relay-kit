import { useMemo, type FC } from 'react'
import {
  Button,
  Flex,
  Text,
  Box,
  Input,
  ChainIcon
} from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons'
import { truncateAddress } from '../../../../utils/truncate.js'
import { formatBN } from '../../../../utils/numbers.js'
import {
  TokenSelectorStep,
  type EnhancedCurrencyList
} from '../TokenSelector.js'
import type { Currency } from '@reservoir0x/relay-kit-hooks'
import Fuse from 'fuse.js'
import useRelayClient from '../../../../hooks/useRelayClient.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import { useMediaQuery } from 'usehooks-ts'
import type { Token } from '../../../../types/index.js'

type SetChainStepProps = {
  type?: 'token' | 'chain'
  size: 'mobile' | 'desktop'
  token?: Token
  setTokenSelectorStep: React.Dispatch<React.SetStateAction<TokenSelectorStep>>
  setInputElement: React.Dispatch<React.SetStateAction<HTMLInputElement | null>>
  chainSearchInput: string
  setChainSearchInput: React.Dispatch<React.SetStateAction<string>>
  selectToken: (currency: Currency, chainId?: number) => void
  selectedCurrencyList?: EnhancedCurrencyList
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['relayChain.chainId', 'relayChain.name']
}

export const SetChainStep: FC<SetChainStepProps> = ({
  type,
  size,
  token,
  setTokenSelectorStep,
  setInputElement,
  chainSearchInput,
  setChainSearchInput,
  selectToken,
  selectedCurrencyList
}) => {
  const client = useRelayClient()
  const isSmallDevice = useMediaQuery('(max-width: 600px)')
  const isDesktop = size === 'desktop' && !isSmallDevice
  const tokenIsDefined = token !== undefined

  const supportedChains = selectedCurrencyList?.chains || []
  const allChains = client?.chains || []
  const combinedChains = [
    ...supportedChains.map((chain) => ({ ...chain, isSupported: true })),
    ...allChains
      .filter((chain) => !supportedChains.some((sc) => sc.chainId === chain.id))
      .map((chain) => ({ ...chain, isSupported: false }))
  ]

  const chainFuse = new Fuse(combinedChains, fuseSearchOptions)

  const filteredChains = useMemo(() => {
    const searchResults =
      chainSearchInput.trim() !== ''
        ? chainFuse.search(chainSearchInput).map((result) => result.item)
        : combinedChains

    const supported = searchResults
      .filter((chain) => chain.isSupported)
      .map((currency) => {
        const enhancedCurrency =
          currency as EnhancedCurrencyList['chains'][number]
        return {
          ...enhancedCurrency,
          totalBalance: BigInt(enhancedCurrency?.balance?.amount ?? 0n)
        }
      })
      .sort((a, b) => {
        if (a.totalBalance !== 0n || b.totalBalance !== 0n) {
          return b.totalBalance > a.totalBalance ? 1 : -1
        } else {
          return a.relayChain.name.localeCompare(b.relayChain.name)
        }
      })

    const unsupported =
      type === 'chain'
        ? (searchResults.filter((chain) => !chain.isSupported) as RelayChain[])
        : []

    return { supported, unsupported }
  }, [chainSearchInput, chainFuse, combinedChains, type])

  return (
    <>
      {type === 'token' ? (
        <Button
          color="ghost"
          size="xs"
          css={{ position: 'absolute', top: -8, left: 0, color: 'gray9' }}
          onClick={() => setTokenSelectorStep(TokenSelectorStep.SetCurrency)}
        >
          <FontAwesomeIcon icon={faChevronLeft} width={10} />
        </Button>
      ) : null}
      <Text
        style="h6"
        css={{
          width: '100%',
          textAlign: 'left',
          marginLeft: type === 'token' ? '80px' : '0'
        }}
      >
        Select Chain
        {tokenIsDefined ? (
          <> for {selectedCurrencyList?.chains?.[0]?.symbol}</>
        ) : null}
      </Text>
      <Input
        inputRef={(element) => {
          setInputElement(element)
        }}
        placeholder="Search for a chain"
        icon={
          <Box css={{ color: 'gray9' }}>
            <FontAwesomeIcon icon={faMagnifyingGlass} width={16} height={16} />
          </Box>
        }
        containerCss={{ width: '100%', height: 40 }}
        css={{
          width: '100%',
          _placeholder_parent: {
            textOverflow: 'ellipsis'
          }
        }}
        value={chainSearchInput}
        onChange={(e) =>
          setChainSearchInput((e.target as HTMLInputElement).value)
        }
      />

      <Flex
        direction={'column'}
        css={{
          display: isDesktop ? 'grid' : 'flex',
          gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : 'none',
          gridColumnGap: isDesktop ? '8px' : '0',
          gridAutoRows: 'min-content',
          height: 350,
          overflowY: 'auto',
          pb: '2',
          gap: isDesktop ? '0' : '2',
          width: '100%'
        }}
      >
        {filteredChains?.supported?.map((currency) => {
          const decimals = currency?.balance?.decimals ?? 18
          const compactBalance = Boolean(
            currency.balance?.amount &&
              decimals &&
              currency.balance.amount.toString().length - decimals > 4
          )
          return (
            <Button
              key={currency.chainId}
              color="ghost"
              onClick={() => {
                selectToken(currency, currency.chainId)
              }}
              css={{
                minHeight: 'auto',
                gap: '2',
                cursor: 'pointer',
                px: '2',
                py: '2',
                transition: 'backdrop-filter 250ms linear',
                _hover: {
                  backgroundColor: 'gray/10'
                },
                flexShrink: 0,
                alignContent: 'center',
                display: 'flex',
                width: '100%'
              }}
            >
              <ChainIcon
                chainId={currency.chainId}
                width={24}
                height={24}
                css={{ borderRadius: 4, overflow: 'hidden' }}
              />
              <Flex direction="column" align="start">
                <Text style="subtitle1">{currency.relayChain.name}</Text>
                <Text style="subtitle3" color="subtle">
                  {truncateAddress(currency.address)}
                </Text>
              </Flex>
              {currency?.balance?.amount ? (
                <Text css={{ ml: 'auto' }} style="subtitle3" color="subtle">
                  {formatBN(
                    BigInt(currency.balance.amount),
                    5,
                    decimals,
                    compactBalance
                  )}
                </Text>
              ) : null}
            </Button>
          )
        })}

        {filteredChains?.unsupported?.length > 0 && (
          <>
            {tokenIsDefined ? (
              <Text style="subtitle2" color="subtle" css={{ pl: '2', mt: '2' }}>
                Other Chains
              </Text>
            ) : null}

            {filteredChains.unsupported.map((chain) => {
              const nativeToken = {
                ...chain.currency,
                metadata: {
                  logoURI: `https://assets.relay.link/icons/currencies/${chain?.currency?.id}.png`
                }
              }
              return (
                <Button
                  key={chain.id}
                  color="ghost"
                  onClick={() => {
                    selectToken(nativeToken, chain.id)
                  }}
                  css={{
                    gap: '2',
                    cursor: 'pointer',
                    px: '2',
                    py: '2',
                    transition: 'backdrop-filter 250ms linear',
                    _hover: {
                      backgroundColor: 'gray/10'
                    },
                    flexShrink: 0,
                    alignContent: 'center',
                    display: 'flex',
                    width: '100%'
                  }}
                >
                  <ChainIcon
                    chainId={chain.id}
                    width={24}
                    height={24}
                    css={{ borderRadius: 4, overflow: 'hidden' }}
                  />
                  <Flex direction="column" align="start">
                    <Text style="subtitle1">{chain.displayName}</Text>
                    <Text style="subtitle3" color="subtle">
                      {/* {truncateAddress(nativeToken?.address)} */}
                      {nativeToken?.symbol}
                    </Text>
                  </Flex>
                </Button>
              )
            })}
          </>
        )}
      </Flex>
    </>
  )
}
