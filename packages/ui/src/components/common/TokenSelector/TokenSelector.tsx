import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Flex, Text, Input, Box } from '../../primitives/index.js'
import { Modal } from '../Modal.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import type { Token } from '../../../types/index.js'
import { type ChainFilterValue } from './ChainFilter.js'
import useRelayClient from '../../../hooks/useRelayClient.js'
import { isAddress, type Address } from 'viem'
import { useDebounceState, useDuneBalances } from '../../../hooks/index.js'
import { useMediaQuery } from 'usehooks-ts'
import { useTokenList } from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../../constants/events.js'
import { UnverifiedTokenModal } from '../UnverifiedTokenModal.js'
import { useEnhancedTokensList } from '../../../hooks/useEnhancedTokensList.js'
import ChainFilter from './ChainFilter.js'
import { TokenList } from './TokenList.js'
import { UnsupportedDepositAddressChainIds } from '../../../constants/depositAddresses.js'
import {
  getRelayUiKitData,
  setRelayUiKitData
} from '../../../utils/localStorage.js'
import {
  AccessibleList,
  AccessibleListItem
} from '../../primitives/AccessibleList.js'
import { eclipse, solana } from '../../../utils/solana.js'
import { bitcoin } from '../../../utils/bitcoin.js'
import { ChainFilterSidebar } from './ChainFilterSidebar.js'
import { SuggestedTokens } from './SuggestedTokens.js'
import {
  convertApiCurrencyToToken,
  mergeTokenLists
} from '../../../utils/tokens.js'
import {
  bitcoinDeadAddress,
  evmDeadAddress,
  solDeadAddress
} from '@reservoir0x/relay-sdk'

export type TokenSelectorProps = {
  token?: Token
  restrictedToken?: Token
  trigger: ReactNode
  chainIdsFilter?: number[]
  lockedChainIds?: number[]
  context: 'from' | 'to'
  address?: Address | string
  isValidAddress?: boolean
  multiWalletSupportEnabled?: boolean
  depositAddressOnly?: boolean
  setToken: (token: Token) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

const TokenSelector: FC<TokenSelectorProps> = ({
  token,
  restrictedToken,
  trigger,
  chainIdsFilter,
  lockedChainIds,
  context,
  address,
  isValidAddress,
  multiWalletSupportEnabled = false,
  depositAddressOnly,
  setToken,
  onAnalyticEvent
}) => {
  const relayClient = useRelayClient()
  const isDesktop = useMediaQuery('(min-width: 660px)')

  const [open, setOpen] = useState(false)

  const [unverifiedTokenModalOpen, setUnverifiedTokenModalOpen] =
    useState(false)
  const [unverifiedToken, setUnverifiedToken] = useState<Token | undefined>()

  const [chainFilter, setChainFilter] = useState<ChainFilterValue>({
    id: undefined,
    name: 'All'
  })

  const {
    value: tokenSearchInput,
    debouncedValue: debouncedTokenSearchValue,
    setValue: setTokenSearchInput
  } = useDebounceState<string>('', 500)

  // Configure chains
  const configuredChains = useMemo(() => {
    let chains =
      relayClient?.chains.sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      ) ?? []

    if (!multiWalletSupportEnabled && context === 'from') {
      chains = chains.filter((chain) => chain.vmType === 'evm')
    }
    if (depositAddressOnly) {
      chains = chains.filter(
        ({ id }) => !UnsupportedDepositAddressChainIds.includes(id)
      )
    }
    return chains
  }, [
    relayClient?.chains,
    multiWalletSupportEnabled,
    context,
    depositAddressOnly
  ])

  const configuredChainIds = useMemo(() => {
    if (lockedChainIds) {
      return lockedChainIds
    }

    let _chainIds = configuredChains.map((chain) => chain.id)
    if (chainIdsFilter) {
      _chainIds = _chainIds.filter((id) => !chainIdsFilter.includes(id))
    }
    return _chainIds
  }, [configuredChains, lockedChainIds, chainIdsFilter, depositAddressOnly])

  const chainFilterOptions =
    context === 'from'
      ? configuredChains?.filter(
          (chain) =>
            (chain.vmType === 'evm' ||
              chain.vmType === 'tvm' ||
              chain.id === solana.id ||
              chain.id === eclipse.id ||
              chain.id === bitcoin.id) &&
            configuredChainIds.includes(chain.id)
        )
      : configuredChains

  const allChains = [
    { id: undefined, name: 'All Chains' },
    ...chainFilterOptions
  ]

  const useDefaultTokenList = debouncedTokenSearchValue === ''

  // Get user's token balances
  const {
    data: duneTokens,
    balanceMap: tokenBalances,
    isLoading: isLoadingBalances
  } = useDuneBalances(
    address &&
      address !== evmDeadAddress &&
      address !== solDeadAddress &&
      address !== bitcoinDeadAddress &&
      isValidAddress
      ? address
      : undefined,
    relayClient?.baseApiUrl?.includes('testnet') ? 'testnet' : 'mainnet'
  )

  // Filter dune token balances based on configured chains
  const filteredDuneTokenBalances = useMemo(() => {
    return duneTokens?.balances?.filter((balance) =>
      configuredChainIds.includes(balance.chain_id)
    )
  }, [duneTokens?.balances, configuredChainIds])

  const userTokensQuery = useMemo(() => {
    if (filteredDuneTokenBalances && filteredDuneTokenBalances.length > 0) {
      return filteredDuneTokenBalances.map(
        (balance) => `${balance.chain_id}:${balance.address}`
      )
    }
    return undefined
  }, [filteredDuneTokenBalances])

  // Get user's tokens from currencies api
  const { data: userTokens, isLoading: isLoadingUserTokens } = useTokenList(
    relayClient?.baseApiUrl,
    userTokensQuery
      ? {
          tokens: userTokensQuery,
          limit: 30,
          depositAddressOnly
        }
      : undefined,
    {
      enabled: !!filteredDuneTokenBalances
    }
  )

  // Get main token list
  const { data: tokenList, isLoading: isLoadingTokenList } = useTokenList(
    relayClient?.baseApiUrl,
    {
      chainIds: chainFilter.id
        ? [chainFilter.id]
        : configuredChains.map((c) => c.id),
      address: isAddress(debouncedTokenSearchValue)
        ? debouncedTokenSearchValue
        : undefined,
      term: !isAddress(debouncedTokenSearchValue)
        ? debouncedTokenSearchValue
        : undefined,
      defaultList: useDefaultTokenList && !depositAddressOnly,
      limit: 12,
      depositAddressOnly
    }
  )

  // Get external token list for search
  const { data: externalTokenList, isLoading: isLoadingExternalList } =
    useTokenList(
      relayClient?.baseApiUrl,
      {
        chainIds: chainFilter.id
          ? [chainFilter.id]
          : configuredChains.map((c) => c.id),
        address: isAddress(debouncedTokenSearchValue)
          ? debouncedTokenSearchValue
          : undefined,
        term: !isAddress(debouncedTokenSearchValue)
          ? debouncedTokenSearchValue
          : undefined,
        defaultList: false,
        limit: 12,
        useExternalSearch: true
      },
      {
        enabled: !!debouncedTokenSearchValue && !depositAddressOnly
      }
    )

  // Merge token lists when searching
  const combinedTokenList = useMemo(() => {
    if (!debouncedTokenSearchValue) return tokenList
    return mergeTokenLists([tokenList, externalTokenList])
  }, [tokenList, externalTokenList, debouncedTokenSearchValue])

  const sortedUserTokens = useEnhancedTokensList(
    userTokens,
    tokenBalances,
    context,
    multiWalletSupportEnabled,
    chainFilter.id
  )

  const sortedCombinedTokens = useEnhancedTokensList(
    combinedTokenList,
    tokenBalances,
    context,
    multiWalletSupportEnabled,
    chainFilter.id
  )

  console.log('tokenList', tokenList)
  console.log('externalTokenList', externalTokenList)
  console.log('combinedTokenList', combinedTokenList)
  console.log('sortedUserTokens', sortedUserTokens)
  console.log('sortedCombinedTokens', sortedCombinedTokens)

  const resetState = useCallback(() => {
    setTokenSearchInput('')
    const chain = relayClient?.chains?.find(
      (chain) => chain.id === token?.chainId
    )
    setChainFilter(
      chain ?? {
        id: undefined,
        name: 'All'
      }
    )
  }, [])

  const handleTokenSelection = useCallback(
    (selectedToken: Token) => {
      const isVerified = selectedToken.verified

      if (!isVerified) {
        const relayUiKitData = getRelayUiKitData()
        const tokenKey = `${selectedToken.chainId}:${selectedToken.address}`
        const isAlreadyAccepted =
          relayUiKitData.acceptedUnverifiedTokens.includes(tokenKey)

        if (isAlreadyAccepted) {
          setToken(selectedToken)
        } else {
          setUnverifiedToken(selectedToken)
          setUnverifiedTokenModalOpen(true)
          return
        }
      } else {
        setToken(selectedToken)
      }

      setOpen(false)
      resetState()
    },
    [setToken, setOpen, resetState]
  )

  useEffect(() => {
    if (!open) {
      resetState()
    }
    // @TODO: This is a hack to set the chain filter to the first chain if there is only one chain
    // We should update the chain filter to the first chain when the modal opens
    if (configuredChainIds.length === 1) {
      const chain = relayClient?.chains.find(
        (chain) => chain.id === configuredChainIds[0]
      )
      if (chain) {
        setChainFilter(chain)
      }
    }
  }, [open])

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Modal
          open={open}
          onOpenChange={(openChange) => {
            onAnalyticEvent?.(
              openChange
                ? EventNames.SWAP_START_TOKEN_SELECT
                : EventNames.SWAP_EXIT_TOKEN_SELECT,
              {
                direction: context === 'from' ? 'input' : 'output'
              }
            )
            setOpen(openChange)
          }}
          showCloseButton={true}
          trigger={trigger}
          css={{
            p: '4',
            display: 'flex',
            flexDirection: 'column',
            height: 'min(85vh, 600px)',
            '@media(min-width: 660px)': {
              minWidth: isDesktop
                ? configuredChainIds.length > 1
                  ? 660
                  : 378
                : 400,
              maxWidth: isDesktop && configuredChainIds.length > 1 ? 660 : 378
            }
          }}
        >
          <Flex
            direction="column"
            css={{
              width: '100%',
              height: '100%',
              gap: '3',
              overflowY: 'hidden'
            }}
          >
            <Text style="h6">Select Token</Text>

            <Flex css={{ flex: 1, gap: '3', overflow: 'hidden' }}>
              {/* Desktop Chain Filter Sidebar */}
              {isDesktop &&
              (!configuredChainIds || configuredChainIds.length > 1) ? (
                <ChainFilterSidebar
                  options={allChains}
                  value={chainFilter}
                  onSelect={setChainFilter}
                  onAnalyticEvent={onAnalyticEvent}
                />
              ) : null}

              {/* Main Token Content */}
              {/* <Flex
                direction="column"
                css={{
                  flex: 1,
                  overflow: 'hidden'
                }}
              > */}
              <AccessibleList
                onSelect={(value) => {
                  if (value === 'input') return
                  const [chainId, address] = value.split(':')
                  const allTokens = [
                    ...sortedUserTokens,
                    ...sortedCombinedTokens
                  ]
                  const selectedToken = allTokens.find(
                    (token) =>
                      token.chainId === Number(chainId) &&
                      token.address?.toLowerCase() === address?.toLowerCase()
                  )
                  if (selectedToken) {
                    handleTokenSelection(selectedToken)
                  }
                }}
                css={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  gap: '1',
                  height: '100%',
                  overflowY: 'auto',
                  scrollPaddingTop: '40px'
                }}
              >
                <Flex
                  align="start"
                  css={{
                    width: '100%',
                    gap: '2',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    background: 'modal-background'
                  }}
                >
                  <AccessibleListItem value="input" asChild>
                    <Input
                      placeholder="Search for a token or paste address"
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
                        scrollSnapAlign: 'start',
                        mb: '2'
                      }}
                      css={{
                        width: '100%',
                        _placeholder_parent: {
                          textOverflow: 'ellipsis'
                        }
                      }}
                      value={tokenSearchInput}
                      onChange={(e) =>
                        setTokenSearchInput(
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </AccessibleListItem>
                  {!isDesktop &&
                  (!configuredChainIds || configuredChainIds.length > 1) ? (
                    <ChainFilter
                      options={allChains}
                      value={chainFilter}
                      onSelect={setChainFilter}
                    />
                  ) : null}
                </Flex>

                <Flex direction="column" css={{ gap: '3' }}>
                  {/* Suggested Tokens */}
                  {chainFilter.id &&
                  tokenSearchInput.length === 0 &&
                  !depositAddressOnly ? (
                    <SuggestedTokens
                      chainId={chainFilter.id}
                      depositAddressOnly={depositAddressOnly}
                      onSelect={(token) => {
                        const newToken = convertApiCurrencyToToken(
                          token,
                          token.chainId!
                        )
                        handleTokenSelection(newToken)
                      }}
                    />
                  ) : null}

                  {/* Token Lists */}
                  {debouncedTokenSearchValue ? (
                    <TokenList
                      title="Search Results"
                      tokens={sortedCombinedTokens}
                      isLoading={isLoadingTokenList || isLoadingExternalList}
                      isLoadingBalances={isLoadingBalances}
                    />
                  ) : (
                    <>
                      {sortedUserTokens.length > 0 && (
                        <TokenList
                          title="Your Tokens"
                          tokens={sortedUserTokens}
                          isLoading={isLoadingUserTokens}
                          isLoadingBalances={isLoadingBalances}
                        />
                      )}
                      <TokenList
                        title="Popular Tokens"
                        tokens={sortedCombinedTokens}
                        isLoading={isLoadingTokenList}
                        isLoadingBalances={isLoadingBalances}
                      />
                    </>
                  )}

                  {/* Empty State */}
                  {!isLoadingTokenList &&
                  !isLoadingExternalList &&
                  tokenList?.length === 0 &&
                  externalTokenList?.length === 0 ? (
                    <Text css={{ textAlign: 'center', py: '5' }}>
                      No results found.
                    </Text>
                  ) : null}
                </Flex>
              </AccessibleList>
              {/* </Flex> */}
            </Flex>
          </Flex>
        </Modal>
      </div>

      {unverifiedTokenModalOpen && (
        <UnverifiedTokenModal
          open={unverifiedTokenModalOpen}
          onOpenChange={setUnverifiedTokenModalOpen}
          token={unverifiedToken}
          onAcceptToken={(token) => {
            if (token) {
              setToken(token)
            }
            setUnverifiedTokenModalOpen(false)
          }}
        />
      )}
    </>
  )
}

export default TokenSelector
