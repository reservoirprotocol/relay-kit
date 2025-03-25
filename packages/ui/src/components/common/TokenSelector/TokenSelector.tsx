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
import { useRelayChains, useTokenList } from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../../constants/events.js'
import { UnverifiedTokenModal } from '../UnverifiedTokenModal.js'
import { useEnhancedTokensList } from '../../../hooks/useEnhancedTokensList.js'
import ChainFilter from './ChainFilter.js'
import { TokenList } from './TokenList.js'
import { UnsupportedDepositAddressChainIds } from '../../../constants/depositAddresses.js'
import { getRelayUiKitData } from '../../../utils/localStorage.js'
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
  solDeadAddress,
  type ChainVM
} from '@reservoir0x/relay-sdk'
import {
  getInitialChainFilter,
  sortChains
} from '../../../utils/tokenSelector.js'

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
  fromChainWalletVMSupported?: boolean
  supportedWalletVMs?: ChainVM[]
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
  fromChainWalletVMSupported,
  supportedWalletVMs,
  setToken,
  onAnalyticEvent
}) => {
  const relayClient = useRelayClient()
  const { chains: allRelayChains } = useRelayChains(relayClient?.baseApiUrl)
  const isDesktop = useMediaQuery('(min-width: 660px)')

  const [open, setOpen] = useState(false)

  const [unverifiedTokenModalOpen, setUnverifiedTokenModalOpen] =
    useState(false)
  const [unverifiedToken, setUnverifiedToken] = useState<Token | undefined>()

  const [chainFilter, setChainFilter] = useState<ChainFilterValue>({
    id: undefined,
    name: 'All Chains'
  })

  const {
    value: tokenSearchInput,
    debouncedValue: debouncedTokenSearchValue,
    setValue: setTokenSearchInput
  } = useDebounceState<string>('', 500)

  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(
    null
  )

  const depositAddressOnly =
    context === 'from'
      ? chainFilter?.vmType
        ? !supportedWalletVMs?.includes(chainFilter.vmType)
        : !chainFilter.id
          ? false
          : !fromChainWalletVMSupported && chainFilter.id === token?.chainId
      : !fromChainWalletVMSupported

  const isReceivingDepositAddress = depositAddressOnly && context === 'to'

  // Configure chains
  const configuredChains = useMemo(() => {
    let chains =
      allRelayChains?.filter((chain) =>
        relayClient?.chains?.find((relayChain) => relayChain.id === chain.id)
      ) ?? []

    if (!multiWalletSupportEnabled && context === 'from') {
      chains = chains.filter((chain) => chain.vmType === 'evm')
    }
    if (isReceivingDepositAddress) {
      chains = chains.filter(
        ({ id }) => !UnsupportedDepositAddressChainIds.includes(id)
      )
    }

    return sortChains(chains)
  }, [
    allRelayChains,
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

  const hasMultipleConfiguredChainIds = configuredChainIds.length > 1

  const chainFilterOptions =
    context === 'from'
      ? configuredChains?.filter(
          (chain) =>
            (chain.vmType === 'evm' ||
              chain.vmType === 'suivm' ||
              chain.vmType === 'tvm' ||
              chain.id === solana.id ||
              chain.id === eclipse.id ||
              chain.id === bitcoin.id) &&
            configuredChainIds.includes(chain.id)
        )
      : configuredChains?.filter((chain) =>
          configuredChainIds.includes(chain.id)
        )

  const allChains = [
    ...(isReceivingDepositAddress
      ? []
      : [{ id: undefined, name: 'All Chains' }]),
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
          limit: 100,
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

  const resetState = useCallback(() => {
    setTokenSearchInput('')
    setInputElement(null)
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
    },
    [setToken, setOpen, resetState]
  )

  useEffect(() => {
    if (!open) {
      resetState()
    } else {
      // Get initial chain filter
      const chainFilter = getInitialChainFilter(
        chainFilterOptions,
        context,
        depositAddressOnly,
        token
      )

      setChainFilter(chainFilter)
    }
  }, [open])

  // Focus input element when modal opens
  useEffect(() => {
    if (open && inputElement && isDesktop) {
      inputElement.focus()
    }
  }, [open, inputElement])

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
                ? hasMultipleConfiguredChainIds
                  ? 660
                  : 408
                : 400,
              maxWidth: isDesktop && hasMultipleConfiguredChainIds ? 660 : 408
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
              (!configuredChainIds || hasMultipleConfiguredChainIds) ? (
                <ChainFilterSidebar
                  options={allChains}
                  value={chainFilter}
                  onSelect={setChainFilter}
                  onAnalyticEvent={onAnalyticEvent}
                  onInputRef={context === 'to' ? setInputElement : undefined}
                />
              ) : null}

              {/* Main Token Content */}
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
                  height: '100%'
                }}
              >
                {/* Search Input Section - Fixed */}
                <Flex
                  direction="column"
                  align="start"
                  css={{
                    width: '100%',
                    gap: '2',
                    background: 'modal-background'
                  }}
                >
                  <AccessibleListItem value="input" asChild>
                    <Input
                      ref={
                        context === 'from' || !hasMultipleConfiguredChainIds
                          ? setInputElement
                          : undefined
                      }
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
                        mb: isDesktop ? '1' : '0'
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
                  (!configuredChainIds || hasMultipleConfiguredChainIds) ? (
                    <ChainFilter
                      options={allChains}
                      value={chainFilter}
                      onSelect={setChainFilter}
                    />
                  ) : null}
                </Flex>

                {/* Token Lists Section  */}
                <Flex
                  key={chainFilter.id ?? 'all'}
                  direction="column"
                  css={{
                    flex: 1,
                    overflowY: 'auto',
                    gap: '3',
                    pt: '2',
                    scrollbarColor: 'var(--relay-colors-gray5) transparent'
                  }}
                >
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
                  {tokenSearchInput.length > 0 ? (
                    <TokenList
                      title="Results"
                      tokens={sortedCombinedTokens}
                      isLoading={
                        isLoadingTokenList ||
                        tokenSearchInput !== debouncedTokenSearchValue
                      }
                      isLoadingBalances={isLoadingBalances}
                      chainFilterId={chainFilter.id}
                    />
                  ) : (
                    <Flex direction="column" css={{ gap: '3' }}>
                      {[
                        {
                          title: 'Your Tokens',
                          tokens: sortedUserTokens,
                          isLoading: isLoadingUserTokens,
                          show: sortedUserTokens.length > 0
                        },
                        {
                          title: 'Popular Tokens',
                          tokens: sortedCombinedTokens,
                          isLoading: isLoadingTokenList,
                          show: true
                        }
                      ]
                        .sort((a, b) => (context === 'to' ? -1 : 1)) // Reverse order depending on context
                        .map(
                          ({ title, tokens, isLoading, show }) =>
                            show && (
                              <TokenList
                                key={title}
                                title={title}
                                tokens={tokens}
                                isLoading={isLoading}
                                isLoadingBalances={isLoadingBalances}
                                chainFilterId={chainFilter.id}
                              />
                            )
                        )}
                    </Flex>
                  )}

                  {/* Empty State */}
                  {!isLoadingTokenList &&
                  !isLoadingExternalList &&
                  tokenList?.length === 0 &&
                  externalTokenList?.length === 0 ? (
                    <Text color="subtle" css={{ textAlign: 'center', py: '5' }}>
                      No results.
                    </Text>
                  ) : null}
                </Flex>
              </AccessibleList>
            </Flex>
          </Flex>
        </Modal>
      </div>

      {unverifiedTokenModalOpen && (
        <UnverifiedTokenModal
          open={unverifiedTokenModalOpen}
          onOpenChange={setUnverifiedTokenModalOpen}
          data={unverifiedToken ? { token: unverifiedToken } : undefined}
          onAcceptToken={(token) => {
            if (token) {
              handleTokenSelection(token)
            }
            setUnverifiedTokenModalOpen(false)
          }}
        />
      )}
    </>
  )
}

export default TokenSelector
