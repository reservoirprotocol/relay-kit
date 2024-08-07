import { type FC, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  ChainIcon,
  Flex,
  Input,
  Skeleton,
  Text
} from '../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass'
import { Modal } from '../common/Modal.js'
import type { Token } from '../../types/index.js'
import Fuse from 'fuse.js'
import ChainFilter, { type ChainFilterValue } from '../common/ChainFilter.js'
import useRelayClient from '../../hooks/useRelayClient.js'
import { type Chain, isAddress, zeroAddress } from 'viem'
import { useDebounceState, useDuneBalances } from '../../hooks/index.js'
import { useMediaQuery } from 'usehooks-ts'
import { LoadingSpinner } from '../common/LoadingSpinner.js'
import { truncateAddress } from '../../utils/truncate.js'
import { useAccount } from 'wagmi'
import { type DuneBalanceResponse } from '../../hooks/useDuneBalances.js'
import { formatBN } from '../../utils/numbers.js'
import {
  type CurrencyList,
  type Currency,
  useTokenList
} from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../constants/events.js'
import { SOL } from '../../constants/currencies.js'

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['relayChain.chainId', 'relayChain.name']
}

type TokenSelectorProps = {
  token?: Token
  restrictedTokensList?: Token[]
  chainIdsFilter?: number[]
  locked: boolean
  context: 'from' | 'to'
  setToken: (token: Token) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

type EnhancedCurrencyList = {
  chains: (CurrencyList[number] & {
    relayChain: Chain
    balance?: DuneBalanceResponse['balances'][0]
  })[]
  totalValueUsd?: number
  totalBalance?: bigint
}

enum TokenSelectorStep {
  SetCurrency,
  SetChain
}

const TokenSelector: FC<TokenSelectorProps> = ({
  token,
  restrictedTokensList,
  chainIdsFilter,
  locked,
  context,
  setToken,
  onAnalyticEvent
}) => {
  const [open, setOpen] = useState(false)
  const { address } = useAccount()
  const isSmallDevice = useMediaQuery('(max-width: 600px)')
  const [tokenSelectorStep, setTokenSelectorStep] = useState<TokenSelectorStep>(
    TokenSelectorStep.SetCurrency
  )
  const [chainFilter, setChainFilter] = useState<ChainFilterValue>({
    id: undefined,
    name: 'All'
  })
  const [selectedCurrencyList, setSelectedCurrencyList] =
    useState<EnhancedCurrencyList>()
  const {
    value: tokenSearchInput,
    debouncedValue: debouncedTokenSearchValue,
    setValue: setTokenSearchInput
  } = useDebounceState<string>('', 500)
  const [chainSearchInput, setChainSearchInput] = useState('')
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(
    null
  )

  const relayClient = useRelayClient()
  const configuredChains = useMemo(() => {
    return (
      relayClient?.chains
        .map((chain) => chain.viemChain as Chain)
        .sort((a, b) => a.name.localeCompare(b.name)) ?? []
    )
  }, [relayClient?.chains])
  const configuredChainIds = useMemo(() => {
    if (chainIdsFilter) {
      return chainIdsFilter
    }
    return configuredChains.map((chain) => chain.id)
  }, [configuredChains, chainIdsFilter])

  const solanaIsSupported = Boolean(
    configuredChainIds?.find((id) => id === 792703809)
  )

  const useDefaultTokenList =
    debouncedTokenSearchValue === '' &&
    chainFilter.id === undefined &&
    (!restrictedTokensList || !restrictedTokensList.length)

  let tokenListQuery: string[] | undefined

  if (restrictedTokensList && restrictedTokensList.length > 0) {
    tokenListQuery = restrictedTokensList.map(
      (token) => `${token.chainId}:${token.address}`
    )
  }

  const { data: tokenList, isLoading: isLoadingTokenList } = useTokenList(
    relayClient?.baseApiUrl,
    {
      chainIds: chainFilter.id ? [chainFilter.id] : configuredChainIds,
      address: isAddress(debouncedTokenSearchValue)
        ? debouncedTokenSearchValue
        : undefined,
      term: !isAddress(debouncedTokenSearchValue)
        ? debouncedTokenSearchValue
        : undefined,
      defaultList: useDefaultTokenList,
      limit: 20,
      ...(tokenListQuery ? { tokens: tokenListQuery } : {})
    }
  )

  const {
    data: duneTokens,
    balanceMap: tokenBalances,
    isLoading: isLoadingDuneBalances
  } = useDuneBalances(address && address !== zeroAddress ? address : undefined)

  const restrictedTokenAddresses = restrictedTokensList?.map((token) =>
    token.address.toLowerCase()
  )

  const duneTokenBalances = duneTokens?.balances.filter((balance) => {
    if (restrictedTokenAddresses) {
      return (
        restrictedTokenAddresses.includes(balance.address.toLowerCase()) &&
        configuredChainIds.includes(balance.chain_id)
      )
    } else {
      return configuredChainIds.includes(balance.chain_id)
    }
  })

  let suggestedTokenQuery: string[] | undefined

  if (restrictedTokensList && restrictedTokensList.length > 0) {
    suggestedTokenQuery = restrictedTokensList.map(
      (token) => `${token.chainId}:${token.address}`
    )
  } else if (duneTokenBalances) {
    suggestedTokenQuery = duneTokenBalances.map(
      (balance) => `${balance.chain_id}:${balance.address}`
    )
  }

  const { data: suggestedTokens, isLoading: isLoadingSuggestedTokens } =
    useTokenList(
      relayClient?.baseApiUrl,
      suggestedTokenQuery
        ? {
            tokens: suggestedTokenQuery,
            limit: 20
          }
        : undefined,
      {
        enabled: duneTokenBalances ? true : false
      }
    )
  // Filter out unconfigured chains and append Relay Chain to each currency
  const enhancedCurrencyList = useMemo(() => {
    const _tokenList =
      tokenList && (tokenList as any).length
        ? (tokenList as CurrencyList[])
        : undefined
    let list =
      context === 'from' &&
      useDefaultTokenList &&
      suggestedTokens &&
      suggestedTokens.length > 0
        ? suggestedTokens
        : tokenList

    // @TODO: Remove once the token list api supports SVM addresses
    // Add the SOL token to the token list if the context is 'to' and the search value is empty or matches "s", "so", or "sol"
    const searchValue = debouncedTokenSearchValue.toLowerCase()
    if (
      context === 'to' &&
      solanaIsSupported &&
      (searchValue === '' ||
        searchValue.startsWith('s') ||
        searchValue.startsWith('so') ||
        searchValue.startsWith('sol'))
    ) {
      const solToken = [SOL]
      list = [...(list || []), [...solToken]]
    }
    const ethTokens = _tokenList?.find(
      (list) => list[0] && list[0].groupID === 'ETH'
    )
    const usdcTokens = _tokenList?.find(
      (list) => list[0] && list[0].groupID === 'USDC'
    )
    if (list && suggestedTokens) {
      list = list?.filter(
        (tokenList) =>
          tokenList[0] &&
          tokenList[0].groupID !== 'ETH' &&
          tokenList[0].groupID !== 'USDC'
      )
      list = [ethTokens ?? [], usdcTokens ?? []].concat(list)
    }
    const mappedList = list?.map((currencyList) => {
      const filteredList = currencyList
        .map((currency) => {
          const relayChain = configuredChains.find(
            (chain) => chain.id === currency.chainId
          )

          if (relayChain) {
            return {
              ...currency,
              relayChain,
              balance: tokenBalances
                ? tokenBalances[`${relayChain.id}:${currency.address}`]
                : undefined
            }
          }
          return undefined
        })
        .filter((currency) => currency !== undefined)

      return filteredList.length > 0 ? filteredList : undefined
    })

    return mappedList
      ?.map((list) => {
        if (!list) return undefined

        const { totalBalance, totalValueUsd } = list.reduce(
          (totals, currency) => {
            totals.totalBalance += BigInt(currency?.balance?.amount ?? 0)
            totals.totalValueUsd += currency?.balance?.value_usd ?? 0
            return totals
          },
          { totalBalance: 0n, totalValueUsd: 0 }
        )
        return {
          chains: list,
          totalBalance,
          totalValueUsd
        }
      })
      .filter((list) => list !== undefined)
      .sort((a, b) => (b?.totalValueUsd ?? 0) - (a?.totalValueUsd ?? 0))
  }, [
    context,
    tokenList,
    suggestedTokens,
    useDefaultTokenList,
    configuredChains,
    tokenBalances
  ])

  const isLoading = isLoadingSuggestedTokens || isLoadingTokenList

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chainFuse = new Fuse(
    selectedCurrencyList?.chains || [],
    fuseSearchOptions
  )

  const filteredChains = useMemo(() => {
    if (chainSearchInput.trim() !== '') {
      return chainFuse.search(chainSearchInput).map((result) => result.item)
    } else {
      return selectedCurrencyList?.chains
        ?.map((currency) => ({
          ...currency,
          totalBalance: BigInt(currency.balance?.amount ?? 0n)
        }))
        .sort((a, b) => {
          if (a.totalBalance !== 0n || b.totalBalance !== 0n) {
            return b.totalBalance > a.totalBalance ? 1 : -1
          } else {
            return a.relayChain.name.localeCompare(b.relayChain.name)
          }
        })
    }
  }, [chainSearchInput, chainFuse, selectedCurrencyList])

  const setCurrencyList = useCallback((currencyList: EnhancedCurrencyList) => {
    setSelectedCurrencyList(currencyList)
    setTokenSelectorStep(TokenSelectorStep.SetChain)
  }, [])

  const resetState = useCallback(() => {
    setTokenSelectorStep(TokenSelectorStep.SetCurrency)
    setTokenSearchInput('')
    setChainSearchInput('')
    setChainFilter({
      id: undefined,
      name: 'All'
    })
  }, [])

  const selectToken = useCallback(
    (currency: Currency, chainId?: number) => {
      if (
        chainId &&
        currency.address &&
        currency.symbol &&
        currency.name &&
        currency.decimals
      ) {
        setToken({
          chainId: chainId,
          address: currency.address,
          symbol: currency.symbol,
          name: currency.name,
          decimals: currency.decimals,
          logoURI: currency.metadata?.logoURI ?? ''
        })
        setOpen(false)
        // reset state
        resetState()
      }
    },
    [setToken, resetState]
  )

  useEffect(() => {
    if (open && inputElement && !isSmallDevice) {
      inputElement.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inputElement])

  return (
    <Modal
      open={open}
      onOpenChange={(openChange) => {
        onAnalyticEvent?.(
          openChange
            ? EventNames.SWAP_START_TOKEN_SELECT
            : EventNames.SWAP_EXIT_TOKEN_SELECT
        )
        setOpen(openChange)
        if (!openChange) {
          resetState()
        }
      }}
      showCloseButton={true}
      trigger={
        token ? (
          <Button
            color="white"
            corners="pill"
            disabled={locked}
            css={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: '3',
              height: 46,
              maxWidth: 162,
              flexShrink: 0,
              overflow: 'hidden',
              _disabled: {
                backgroundColor: 'transparent',
                border: 'none',
                px: 0,
                _hover: {
                  backgroundColor: 'transparent',
                  filter: 'none'
                }
              }
            }}
          >
            <Flex align="center" css={{ gap: '2' }}>
              <img
                alt={token.name}
                src={token.logoURI}
                width={30}
                height={30}
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
            color="primary"
            corners="pill"
            css={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white',
              px: '3',
              height: 46,
              maxWidth: 162,
              flexShrink: 0,
              fontWeight: 500
            }}
          >
            Select Token
            <Box css={{ color: 'white', width: 14 }}>
              <FontAwesomeIcon icon={faChevronDown} width={14} />
            </Box>
          </Button>
        )
      }
      contentCss={{ py: 24, px: '3' }}
    >
      <Flex
        direction="column"
        align="center"
        css={{ width: '100%', height: '100%', gap: '3', position: 'relative' }}
      >
        {tokenSelectorStep === TokenSelectorStep.SetCurrency ? (
          <>
            <Text style="h6">Select Token</Text>
            <Flex align="center" css={{ width: '100%', gap: '2' }}>
              <Input
                inputRef={(element) => {
                  setInputElement(element)
                }}
                placeholder="Search for a token"
                icon={
                  <Box css={{ color: 'gray9' }}>
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      width={16}
                      height={16}
                    />
                  </Box>
                }
                containerCss={{ width: '100%', height: 40 }}
                css={{
                  width: '100%',
                  _placeholder_parent: {
                    textOverflow: 'ellipsis'
                  }
                }}
                value={tokenSearchInput}
                onChange={(e) =>
                  setTokenSearchInput((e.target as HTMLInputElement).value)
                }
              />
              {!chainIdsFilter || chainIdsFilter.length > 1 ? (
                <ChainFilter
                  options={[
                    { id: undefined, name: 'All Chains' },
                    ...configuredChains
                  ]}
                  value={chainFilter}
                  onSelect={(value) => {
                    setChainFilter(value)
                  }}
                />
              ) : null}
            </Flex>
            <Flex
              css={{
                width: '100%',
                '--borderColor': 'colors.subtle-border-color',
                borderBottom: '1px solid var(--borderColor)',
                pr: '4'
              }}
            >
              <Text style="body3" color="subtle" css={{ pl: '2' }}>
                {!isLoading
                  ? useDefaultTokenList
                    ? context === 'from' &&
                      suggestedTokens &&
                      (suggestedTokens as any).length &&
                      (suggestedTokens as any).length > 0
                      ? 'Suggested Tokens'
                      : 'Popular Tokens'
                    : 'Tokens'
                  : null}
              </Text>
              {address ? (
                <Text
                  style="body3"
                  color="subtle"
                  css={{ pl: '2', ml: 'auto' }}
                >
                  Balance
                </Text>
              ) : undefined}
            </Flex>
            <Flex
              direction="column"
              css={{
                height: 350,
                overflowY: 'auto',
                pb: '2',
                gap: '2',
                width: '100%'
              }}
            >
              {/* Loading State*/}
              {isLoading ? (
                <Flex direction="column" align="center" css={{ py: '5' }}>
                  <LoadingSpinner
                    css={{ height: 40, width: 40, fill: 'primary-color' }}
                  />
                </Flex>
              ) : null}
              {/* Data State */}
              {!isLoading &&
              enhancedCurrencyList &&
              enhancedCurrencyList.length > 0
                ? enhancedCurrencyList?.map((list, idx) =>
                    list ? (
                      <CurrencyRow
                        currencyList={list as EnhancedCurrencyList}
                        setCurrencyList={setCurrencyList}
                        selectToken={selectToken}
                        isLoadingDuneBalances={isLoadingDuneBalances}
                        key={idx}
                      />
                    ) : null
                  )
                : null}
              {/* Empty State */}
              {!isLoading &&
              (!enhancedCurrencyList || enhancedCurrencyList?.length === 0) ? (
                <Text css={{ textAlign: 'center', py: '5' }}>
                  No results found.
                </Text>
              ) : null}
            </Flex>
          </>
        ) : null}
        {tokenSelectorStep === TokenSelectorStep.SetChain ? (
          <>
            <Button
              color="ghost"
              size="xs"
              css={{ position: 'absolute', top: -8, left: 0, color: 'gray9' }}
              onClick={() =>
                setTokenSelectorStep(TokenSelectorStep.SetCurrency)
              }
            >
              <FontAwesomeIcon icon={faChevronLeft} width={10} />
            </Button>
            <Text style="h6">
              Select Chain for {selectedCurrencyList?.chains?.[0]?.symbol}
            </Text>
            <Input
              inputRef={(element) => {
                setInputElement(element)
              }}
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
              css={{
                width: '100%',
                '--borderColor': 'colors.subtle-border-color',
                borderBottom: '1px solid var(--borderColor)'
              }}
            >
              <Text style="body3" color="subtle" css={{ pl: '2' }}>
                Chains
              </Text>
            </Flex>
            <Flex
              direction="column"
              css={{
                height: 350,
                overflowY: 'auto',
                pb: '2',
                gap: '2',
                width: '100%'
              }}
            >
              {filteredChains?.map((currency) => {
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
                      gap: '2',
                      cursor: 'pointer',
                      px: '4',
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
                      <Text
                        css={{ ml: 'auto' }}
                        style="subtitle3"
                        color="subtle"
                      >
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
            </Flex>
          </>
        ) : null}
      </Flex>
    </Modal>
  )
}

type CurrencyRowProps = {
  currencyList: EnhancedCurrencyList
  setCurrencyList: (currencyList: EnhancedCurrencyList) => void
  selectToken: (currency: Currency, chainId?: number) => void
  isLoadingDuneBalances: boolean
}

const CurrencyRow: FC<CurrencyRowProps> = ({
  currencyList,
  setCurrencyList,
  selectToken,
  isLoadingDuneBalances
}) => {
  const balance = currencyList.totalBalance
  const decimals =
    currencyList?.chains?.length > 0
      ? currencyList?.chains?.[0].decimals ?? 18
      : 18
  const compactBalance = Boolean(
    balance && decimals && balance.toString().length - decimals > 4
  )

  return (
    <Button
      color="ghost"
      onClick={() => {
        if (currencyList.chains.length > 1) {
          setCurrencyList(currencyList)
        } else {
          selectToken(
            currencyList?.chains?.[0],
            currencyList?.chains?.[0].chainId
          )
        }
      }}
      css={{
        gap: '2',
        cursor: 'pointer',
        px: '4',
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
      <img
        alt={currencyList?.chains?.[0]?.name ?? ''}
        src={currencyList?.chains?.[0].metadata?.logoURI ?? ''}
        width={32}
        height={32}
        style={{ borderRadius: 9999 }}
      />
      <Flex direction="column" align="start">
        <Text style="subtitle2">{currencyList?.chains?.[0]?.symbol}</Text>
        {currencyList?.chains?.length === 1 ? (
          <Text style="subtitle3" color="subtle">
            {truncateAddress(currencyList?.chains?.[0].address)}
          </Text>
        ) : null}
      </Flex>
      <Flex align="center" css={{ position: 'relative' }}>
        {currencyList?.chains?.slice(0, 6).map((currency, index) => (
          <ChainIcon
            chainId={Number(currency.chainId)}
            key={index}
            width={18}
            height={18}
            css={{
              ml: index > 0 ? '-4px' : 0,
              '--borderColor': 'colors.modal-background',
              border: '1px solid var(--borderColor)',
              borderRadius: 4,
              background: 'modal-background',
              overflow: 'hidden'
            }}
          />
        ))}
        {currencyList?.chains?.length > 6 ? (
          <Text style="tiny" css={{ ml: '1' }}>
            + more
          </Text>
        ) : null}
      </Flex>
      {isLoadingDuneBalances && !balance ? (
        <Skeleton css={{ ml: 'auto', width: 60 }} />
      ) : null}
      {balance ? (
        <Text color="subtle" style="subtitle3" css={{ ml: 'auto' }}>
          {formatBN(balance, 5, decimals, compactBalance)}
        </Text>
      ) : null}
    </Button>
  )
}

export default TokenSelector
