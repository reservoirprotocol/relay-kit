import { useMemo, useState, type FC } from 'react'
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
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { formatBN } from '../../../../utils/numbers.js'
import { truncateAddress } from '../../../../utils/truncate.js'
import { LoadingSpinner } from '../../LoadingSpinner.js'
import type { EnhancedCurrencyList } from '../TokenSelector.js'
import type { Currency } from '@reservoir0x/relay-kit-hooks'
import ChainFilter, { type ChainFilterValue } from '../../ChainFilter.js'
import type { Address, Chain } from 'viem'
import type { paths } from '@reservoir0x/relay-sdk'
import Fuse from 'fuse.js'
import { useMediaQuery } from 'usehooks-ts'

type SetCurrencyProps = {
  size: 'mobile' | 'desktop'
  setInputElement: (
    value: React.SetStateAction<HTMLInputElement | null>
  ) => void
  tokenSearchInput: string
  setTokenSearchInput: (value: string) => void
  chainIdsFilter: number[] | undefined
  chainFilterOptions: Chain[]
  chainFilter: ChainFilterValue
  setChainFilter: (value: React.SetStateAction<ChainFilterValue>) => void
  isLoading: boolean
  isLoadingDuneBalances: boolean
  useDefaultTokenList: boolean
  context: 'from' | 'to'
  suggestedTokens?: paths['/currencies/v1']['post']['responses']['200']['content']['application/json']
  address?: Address
  enhancedCurrencyList?: EnhancedCurrencyList[]
  selectToken: (currency: Currency, chainId?: number) => void
  setCurrencyList: (currencyList: EnhancedCurrencyList) => void
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['id', 'name']
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
  useDefaultTokenList,
  context,
  suggestedTokens,
  address,
  enhancedCurrencyList,
  selectToken,
  setCurrencyList
}) => {
  const isSmallDevice = useMediaQuery('(max-width: 600px)')
  const isDesktop = size === 'desktop' && !isSmallDevice
  const allChains = [
    { id: undefined, name: 'All Chains' },
    ...chainFilterOptions
  ]
  const chainFuse = new Fuse(allChains, fuseSearchOptions)
  const [chainSearchInput, setChainSearchInput] = useState('')

  const filteredChains = useMemo(() => {
    if (chainSearchInput.trim() !== '') {
      return chainFuse.search(chainSearchInput).map((result) => result.item)
    } else {
      return allChains
    }
  }, [chainSearchInput, allChains, chainFuse])

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
      <Flex css={{ width: '100%', gap: '3' }}>
        {isDesktop ? (
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
                      css={{
                        p: '2',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        backgroundColor: active ? 'gray5' : '',
                        _hover: {
                          backgroundColor: 'gray4'
                        }
                      }}
                      onClick={() => setChainFilter(chain)}
                    >
                      <ChainIcon
                        chainId={chain.id}
                        square
                        width={24}
                        height={24}
                      />
                      <Text style="subtitle1" ellipsify>
                        {chain.name}
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

  const isSingleChainCurrency = currencyList?.chains?.length === 1

  return (
    <Button
      color="ghost"
      onClick={() => {
        if (!isSingleChainCurrency) {
          setCurrencyList(currencyList)
        } else {
          selectToken(
            currencyList?.chains?.[0],
            currencyList?.chains?.[0].chainId
          )
          setCurrencyList(currencyList)
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
      <Flex direction="column" align="start">
        <Text style="subtitle2">{currencyList?.chains?.[0]?.symbol}</Text>
        {isSingleChainCurrency ? (
          <Text style="subtitle3" color="subtle">
            {truncateAddress(currencyList?.chains?.[0].address)}
          </Text>
        ) : null}
      </Flex>

      {!isSingleChainCurrency ? (
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
      ) : null}
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
