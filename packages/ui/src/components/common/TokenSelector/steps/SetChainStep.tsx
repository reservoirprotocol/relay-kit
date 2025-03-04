import { useMemo, type FC } from 'react'
import {
  Button,
  Flex,
  Text,
  Box,
  Input,
  ChainIcon,
  AccessibleList,
  AccessibleListItem
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
import { useTokenList } from '@reservoir0x/relay-kit-hooks'
import Fuse from 'fuse.js'
import useRelayClient from '../../../../hooks/useRelayClient.js'
import { ASSETS_RELAY_API, type RelayChain } from '@reservoir0x/relay-sdk'
import { useMediaQuery } from 'usehooks-ts'
import type { Token } from '../../../../types/index.js'
import { eclipse, solana } from '../../../../utils/solana.js'
import { bitcoin } from '../../../../utils/bitcoin.js'
import { convertApiCurrencyToToken } from '../../../../utils/tokens.js'
import { tron } from '../../../../utils/tron.js'

type SetChainStepProps = {
  type?: 'token' | 'chain'
  size: 'mobile' | 'desktop'
  context: 'from' | 'to'
  token?: Token
  restrictedToken?: Token
  tokenList?: ReturnType<typeof useTokenList>['data']
  multiWalletSupportEnabled?: boolean
  setTokenSelectorStep: React.Dispatch<React.SetStateAction<TokenSelectorStep>>
  setInputElement: React.Dispatch<React.SetStateAction<HTMLInputElement | null>>
  chainSearchInput: string
  setChainSearchInput: React.Dispatch<React.SetStateAction<string>>
  selectToken: (currency: Currency, chainId?: number) => void
  selectedCurrencyList?: EnhancedCurrencyList
  chainIdsFilter?: number[]
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: [
    'relayChain.chainId',
    'relayChain.name',
    'relayChain.displayName',
    'name',
    'id',
    'displayName'
  ]
}

type NormalizedChain = {
  id: number
  displayName: string
  isSupported: boolean
  currency: EnhancedCurrencyList['chains'][number] | null
  relayChain: RelayChain
}

export const SetChainStep: FC<SetChainStepProps> = ({
  type,
  size,
  context,
  token,
  restrictedToken,
  tokenList,
  multiWalletSupportEnabled = false,
  setTokenSelectorStep,
  setInputElement,
  chainSearchInput,
  setChainSearchInput,
  selectToken,
  chainIdsFilter,
  selectedCurrencyList
}) => {
  const client = useRelayClient()
  const isSmallDevice = useMediaQuery('(max-width: 660px)')
  const isDesktop = size === 'desktop' && !isSmallDevice

  const supportedChains = selectedCurrencyList?.chains || []
  const allChains =
    client?.chains?.filter(
      (chain: RelayChain) =>
        (context !== 'from' ||
          chain.vmType === 'evm' ||
          chain.id === solana.id ||
          chain.id === eclipse.id ||
          chain.id === bitcoin.id ||
          chain.id === tron.id) &&
        (context !== 'from' ||
          multiWalletSupportEnabled ||
          chain.vmType === 'evm') &&
        (!chainIdsFilter || !chainIdsFilter.includes(chain.id))
    ) || []

  const combinedChains: NormalizedChain[] = [
    ...supportedChains.map((currency) => ({
      id: currency.chainId as number,
      displayName: currency.relayChain.displayName,
      isSupported: true,
      currency: currency,
      relayChain: currency.relayChain
    })),
    ...(type === 'chain'
      ? allChains
          .filter(
            (chain) => !supportedChains.some((sc) => sc.chainId === chain.id)
          )
          .map((chain) => ({
            id: chain.id,
            displayName: chain.displayName,
            isSupported: false,
            currency: null,
            relayChain: chain
          }))
      : [])
  ]

  const chainFuse = new Fuse(combinedChains, fuseSearchOptions)

  const filteredChains = useMemo(() => {
    const searchResults =
      chainSearchInput.trim() !== ''
        ? chainFuse.search(chainSearchInput).map((result) => result.item)
        : combinedChains

    return chainSearchInput.trim() === ''
      ? searchResults.sort((a, b) => a.displayName.localeCompare(b.displayName))
      : searchResults
  }, [chainSearchInput, chainFuse, combinedChains])

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
      </Text>
      <AccessibleList
        onSelect={(value) => {
          if (value && value !== 'input') {
            const chain = filteredChains.find(
              (chain) => chain.id.toString() === value
            )
            if (chain) {
              const currency = convertApiCurrencyToToken(
                chain.relayChain.currency?.supportsBridging
                  ? chain.relayChain.currency
                  : chain.relayChain.erc20Currencies
                      ?.filter((currency) => currency.supportsBridging)
                      .sort((a, b) => {
                        const order: Record<string, number> = {
                          ETH: 1,
                          USDC: 2,
                          USDT: 3
                        }
                        const aOrder =
                          a.symbol && order[a.symbol] ? order[a.symbol] : 4
                        const bOrder =
                          b.symbol && order[b.symbol] ? order[b.symbol] : 4
                        return (
                          aOrder - bOrder ||
                          (a?.symbol ?? '').localeCompare(b?.symbol ?? '')
                        )
                      })[0],
                chain.id
              )
              let token: NonNullable<SetChainStepProps['tokenList']>['0']['0'] =
                {
                  ...currency,
                  chainId: chain.id,
                  metadata: {
                    logoURI: `${ASSETS_RELAY_API}/icons/currencies/${chain.relayChain.currency?.id}.png`,
                    verified: true
                  }
                }

              if (
                token.chainId === restrictedToken?.chainId &&
                token.address?.toLowerCase() ===
                  restrictedToken?.address?.toLowerCase()
              ) {
                const alternativeToken = tokenList
                  ?.flatMap((tokenList) => tokenList)
                  .find(
                    (t) =>
                      t.chainId === token.chainId &&
                      t.address?.toLowerCase() !== token.address?.toLowerCase()
                  )

                if (alternativeToken) {
                  token = alternativeToken
                }
              }
              selectToken(token, chain.id)
            }
          }
        }}
        css={{
          display: isDesktop ? 'grid' : 'flex',
          gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : 'none',
          gridColumnGap: isDesktop ? '8px' : '0',
          gridAutoRows: 'min-content',
          maxHeight: 530,
          overflowY: 'auto',
          pb: '2',
          gap: isDesktop ? '0' : '2',
          width: '100%',
          scrollPaddingTop: '40px'
        }}
      >
        <AccessibleListItem value="input" asChild>
          <Input
            ref={setInputElement}
            placeholder="Search for a chain"
            icon={
              <Box css={{ color: 'gray9' }}>
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  width={16}
                  height={16}
                />
              </Box>
            }
            containerCss={{
              width: '100%',
              height: 40,
              scrollSnapAlign: 'start'
            }}
            style={{
              gridColumn: isDesktop ? '1/3' : '',
              marginBottom: isDesktop ? '10px' : '',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
            css={{
              width: '100%',
              _placeholder: {
                textOverflow: 'ellipsis'
              }
            }}
            value={chainSearchInput}
            onChange={(e) =>
              setChainSearchInput((e.target as HTMLInputElement).value)
            }
          />
        </AccessibleListItem>

        {filteredChains?.map((chain) => {
          const decimals = chain?.currency?.balance?.decimals ?? 18
          const compactBalance = Boolean(
            chain?.currency?.balance?.amount &&
              decimals &&
              chain?.currency.balance.amount.toString().length - decimals > 4
          )

          return (
            <AccessibleListItem
              key={chain.id}
              value={chain.id.toString()}
              asChild
            >
              <Button
                color="ghost"
                css={{
                  scrollSnapAlign: 'start',
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
                  width: '100%',
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
                <Flex css={{ gap: '2', alignItems: 'center' }}>
                  <ChainIcon
                    chainId={chain.id}
                    width={24}
                    height={24}
                    css={{ borderRadius: 4, overflow: 'hidden' }}
                  />
                  <Flex direction="column" align="start">
                    <Text style="subtitle1">{chain.displayName}</Text>
                    {type === 'token' ? (
                      <Text style="subtitle3" color="subtle">
                        {truncateAddress(chain?.currency?.address)}
                      </Text>
                    ) : null}
                  </Flex>
                </Flex>

                {chain?.currency?.balance?.amount ? (
                  <Text css={{ ml: 'auto' }} style="subtitle3" color="subtle">
                    {formatBN(
                      BigInt(chain?.currency?.balance?.amount),
                      5,
                      decimals,
                      compactBalance
                    )}
                  </Text>
                ) : null}
              </Button>
            </AccessibleListItem>
          )
        })}
      </AccessibleList>
    </>
  )
}
