import { useEffect, useMemo, useRef, useState, type FC } from 'react'
import {
  Flex,
  Text,
  Box,
  Input,
  Skeleton,
  ChainIcon,
  Button,
  ChainTokenIcon
} from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faExclamationTriangle,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons'
import { formatBN, formatDollar } from '../../../../utils/numbers.js'
import { truncateAddress } from '../../../../utils/truncate.js'
import { LoadingSpinner } from '../../LoadingSpinner.js'
import type { EnhancedCurrencyList } from '../TokenSelector.js'
import type { Currency } from '@reservoir0x/relay-kit-hooks'
import ChainFilter, { type ChainFilterValue } from '../../ChainFilter.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import Fuse from 'fuse.js'
import { useMediaQuery } from 'usehooks-ts'
import type { Token } from '../../../../types/index.js'
import { EventNames } from '../../../../constants/events.js'
import { getRelayUiKitData } from '../../../../utils/localStorage.js'

type SetCurrencyProps = {
  size: 'mobile' | 'desktop'
  setInputElement: (
    value: React.SetStateAction<HTMLInputElement | null>
  ) => void
  tokenSearchInput: string
  setTokenSearchInput: (value: string) => void
  chainIdsFilter: number[] | undefined
  chainFilterOptions: RelayChain[]
  chainFilter: ChainFilterValue
  setChainFilter: (value: React.SetStateAction<ChainFilterValue>) => void
  isLoading: boolean
  isLoadingDuneBalances: boolean
  enhancedCurrencyList?: EnhancedCurrencyList[]
  token?: Token
  selectToken: (currency: Currency, chainId?: number) => void
  setUnverifiedTokenModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setUnverifiedToken: React.Dispatch<React.SetStateAction<Token | undefined>>
  setCurrencyList: (currencyList: EnhancedCurrencyList) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['id', 'name', 'displayName']
}

export const SetCurrencyStep: FC<SetCurrencyProps> = ({
  size,
  setInputElement,
  tokenSearchInput,
  setTokenSearchInput,
  chainIdsFilter,
  chainFilterOptions,
  chainFilter,
  setChainFilter,
  isLoading,
  isLoadingDuneBalances,
  enhancedCurrencyList,
  selectToken,
  setUnverifiedTokenModalOpen,
  setUnverifiedToken,
  setCurrencyList,
  onAnalyticEvent
}) => {
  const isSmallDevice = useMediaQuery('(max-width: 600px)')
  const isDesktop = size === 'desktop' && !isSmallDevice
  const allChains = [
    { id: undefined, name: 'All Chains' },
    ...chainFilterOptions
  ]
  const chainFuse = new Fuse(chainFilterOptions, fuseSearchOptions)
  const [chainSearchInput, setChainSearchInput] = useState('')

  const filteredChains = useMemo(() => {
    if (chainSearchInput.trim() !== '') {
      return chainFuse.search(chainSearchInput).map((result) => result.item)
    } else {
      return allChains
    }
  }, [chainSearchInput, allChains, chainFuse])

  const activeChainRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (activeChainRef.current) {
      activeChainRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'nearest'
      })
    }
  }, [filteredChains, chainFilter])

  return (
    <>
      <Text
        style="h6"
        css={{
          width: '100%',
          textAlign: 'left'
        }}
      >
        Select Token
      </Text>
      <Flex css={{ width: '100%', gap: '2' }}>
        {isDesktop && (!chainIdsFilter || chainIdsFilter.length > 1) ? (
          <>
            <Flex
              direction="column"
              css={{ maxWidth: 170, flexShrink: 0, gap: '1' }}
            >
              <Input
                inputRef={(element) => {
                  setInputElement(element)
                }}
                placeholder="Search chains"
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
                direction="column"
                css={{
                  width: '100%',
                  gap: '1',
                  height: 350,
                  overflowY: 'auto'
                }}
              >
                {filteredChains?.map((chain) => {
                  const active = chainFilter.id === chain.id
                  return (
                    <Button
                      key={chain.id}
                      color="ghost"
                      size="none"
                      ref={active ? activeChainRef : null}
                      css={{
                        p: '2',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        position: 'relative',
                        ...(active && {
                          _before: {
                            content: '""',
                            position: 'absolute',
                            borderRadius: 8,
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0.15,
                            backgroundColor: 'primary-color',
                            zIndex: -1
                          }
                        }),
                        transition: 'backdrop-filter 250ms linear',
                        _hover: {
                          backgroundColor: active ? '' : 'gray/10'
                        }
                      }}
                      onClick={() => {
                        setChainFilter(chain)
                        onAnalyticEvent?.(
                          EventNames.CURRENCY_STEP_CHAIN_FILTER,
                          {
                            chain: chain.name,
                            chain_id: chain.id
                          }
                        )
                      }}
                    >
                      <ChainIcon
                        chainId={chain.id}
                        square
                        width={24}
                        height={24}
                      />
                      <Text style="subtitle1" ellipsify>
                        {('displayName' in chain && chain.displayName) ||
                          chain.name}
                      </Text>
                    </Button>
                  )
                })}
              </Flex>
            </Flex>
            <Box
              css={{
                width: '1px',
                height: 'auto',
                alignSelf: 'stretch',
                '--borderColor': 'colors.subtle-border-color',
                borderRight: '1px solid var(--borderColor)'
              }}
            />
          </>
        ) : null}
        <Flex
          direction="column"
          align="center"
          css={{ width: '100%', gap: '1' }}
        >
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
            {!isDesktop && (!chainIdsFilter || chainIdsFilter.length > 1) ? (
              <ChainFilter
                options={allChains}
                value={chainFilter}
                onSelect={(value) => {
                  setChainFilter(value)
                }}
              />
            ) : null}
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
            enhancedCurrencyList?.length > 0
              ? enhancedCurrencyList?.map((list, idx) =>
                  list ? (
                    <CurrencyRow
                      currencyList={list as EnhancedCurrencyList}
                      setCurrencyList={setCurrencyList}
                      selectToken={selectToken}
                      isLoadingDuneBalances={isLoadingDuneBalances}
                      setUnverifiedToken={setUnverifiedToken}
                      setUnverifiedTokenModalOpen={setUnverifiedTokenModalOpen}
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
        </Flex>
      </Flex>
    </>
  )
}

type CurrencyRowProps = {
  currencyList: EnhancedCurrencyList
  setCurrencyList: (currencyList: EnhancedCurrencyList) => void
  selectToken: (currency: Currency, chainId?: number) => void
  setUnverifiedTokenModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setUnverifiedToken: React.Dispatch<React.SetStateAction<Token | undefined>>
  isLoadingDuneBalances: boolean
}

const CurrencyRow: FC<CurrencyRowProps> = ({
  currencyList,
  setCurrencyList,
  selectToken,
  setUnverifiedTokenModalOpen,
  setUnverifiedToken,
  isLoadingDuneBalances
}) => {
  const totalValueUsd = currencyList.totalValueUsd
  const balance = currencyList.totalBalance
  const decimals =
    currencyList?.chains?.length > 0
      ? currencyList?.chains?.[0].decimals ?? 18
      : 18
  const compactBalance = Boolean(
    balance && decimals && balance.toString().length - decimals > 4
  )

  const isSingleChainCurrency = currencyList?.chains?.length === 1
  const isVerified = currencyList?.chains?.[0].metadata?.verified

  return (
    <Button
      color="ghost"
      onClick={() => {
        if (!isSingleChainCurrency) {
          setCurrencyList(currencyList)
        } else {
          const token = {
            ...currencyList?.chains?.[0],
            logoURI: currencyList?.chains?.[0].metadata?.logoURI
          }

          if (!isVerified) {
            const relayUiKitData = getRelayUiKitData()
            const tokenKey = `${token.chainId}:${token.address}`
            const isAlreadyAccepted =
              relayUiKitData.acceptedUnverifiedTokens.includes(tokenKey)

            if (isAlreadyAccepted) {
              // If already accepted, proceed with selection
              selectToken(token, token.chainId)
              setCurrencyList(currencyList)
            } else {
              setUnverifiedToken(token as Token)
              setUnverifiedTokenModalOpen(true)
            }
          } else {
            selectToken(token, token.chainId)
            setCurrencyList(currencyList)
          }
        }
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
      {isSingleChainCurrency ? (
        <ChainTokenIcon
          chainId={currencyList?.chains?.[0]?.chainId}
          tokenlogoURI={currencyList?.chains?.[0].metadata?.logoURI ?? ''}
          css={{
            width: 32,
            height: 32
          }}
        />
      ) : (
        <img
          alt={currencyList?.chains?.[0]?.name ?? ''}
          src={currencyList?.chains?.[0].metadata?.logoURI ?? ''}
          width={32}
          height={32}
          style={{ borderRadius: 9999 }}
        />
      )}
      <Flex direction="column" align="start" css={{ gap: '2px' }}>
        <Text style="subtitle1" ellipsify css={{ maxWidth: '112px' }}>
          {currencyList?.chains?.[0]?.name}
        </Text>
        <Flex align="center" css={{ gap: '1' }}>
          <Text style="subtitle3" color="subtle">
            {currencyList?.chains?.[0]?.symbol}
          </Text>
          {isSingleChainCurrency ? (
            <Text style="subtitle3" color="subtle">
              {truncateAddress(currencyList?.chains?.[0].address)}
            </Text>
          ) : null}

          {!isVerified ? (
            <Box css={{ color: 'gray8' }}>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                width={16}
                height={16}
              />
            </Box>
          ) : null}
        </Flex>
      </Flex>

      {!isSingleChainCurrency ? (
        <Flex align="center" css={{ position: 'relative' }}>
          {currencyList?.chains?.slice(0, 3).map((currency, index) => (
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
          {currencyList?.chains?.length > 3 ? (
            <Text style="tiny" css={{ ml: '1' }}>
              + more
            </Text>
          ) : null}
        </Flex>
      ) : null}
      <Flex direction="column" align="end" css={{ gap: '2px', ml: 'auto' }}>
        {isLoadingDuneBalances ? (
          <>
            <Skeleton css={{ ml: 'auto', width: 60 }} />
            <Skeleton css={{ ml: 'auto', width: 60 }} />
          </>
        ) : (
          <>
            {balance ? (
              <Text style="subtitle1" css={{ ml: 'auto' }}>
                {formatBN(balance, 4, decimals, compactBalance)}
              </Text>
            ) : null}
            {totalValueUsd ? (
              <Text color="subtle" style="body3">
                {formatDollar(totalValueUsd)}
              </Text>
            ) : null}
          </>
        )}
      </Flex>
    </Button>
  )
}
