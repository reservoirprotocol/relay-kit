import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Flex } from '../../primitives/index.js'
import { Modal } from '../Modal.js'
import type { Token } from '../../../types/index.js'
import { type ChainFilterValue } from '../ChainFilter.js'
import useRelayClient from '../../../hooks/useRelayClient.js'
import { isAddress, type Address } from 'viem'
import { useDebounceState, useDuneBalances } from '../../../hooks/index.js'
import { useMediaQuery } from 'usehooks-ts'
import { type DuneBalanceResponse } from '../../../hooks/useDuneBalances.js'
import {
  type CurrencyList,
  type Currency,
  useTokenList
} from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../../constants/events.js'
import { SetChainStep } from './steps/SetChainStep.js'
import { SetCurrencyStep } from './steps/SetCurrencyStep.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import { solana } from '../../../utils/solana.js'
import { UnverifiedTokenModal } from '../UnverifiedTokenModal.js'
import {
  getRelayUiKitData,
  setRelayUiKitData
} from '../../../utils/localStorage.js'
import { bitcoin } from '../../../utils/bitcoin.js'
import { evmDeadAddress } from '@reservoir0x/relay-sdk'
import { solDeadAddress } from '@reservoir0x/relay-sdk'
import { bitcoinDeadAddress } from '@reservoir0x/relay-sdk'

export type TokenSelectorProps = {
  openState?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  token?: Token
  trigger: ReactNode
  restrictedTokensList?: Token[]
  chainIdsFilter?: number[]
  context: 'from' | 'to'
  type?: 'token' | 'chain'
  size?: 'mobile' | 'desktop'
  address?: Address | string
  isValidAddress?: boolean
  multiWalletSupportEnabled?: boolean
  setToken: (token: Token) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

export type EnhancedCurrencyList = {
  chains: (CurrencyList[number] & {
    relayChain: RelayChain
    balance?: NonNullable<DuneBalanceResponse>['balances'][0]
  })[]
  totalValueUsd?: number
  totalBalance?: bigint
}

export enum TokenSelectorStep {
  SetCurrency,
  SetChain
}

const TokenSelector: FC<TokenSelectorProps> = ({
  openState,
  token,
  trigger,
  restrictedTokensList,
  chainIdsFilter,
  context,
  type = 'token',
  size = 'mobile',
  address,
  isValidAddress,
  multiWalletSupportEnabled = false,
  setToken,
  onAnalyticEvent
}) => {
  const [unverifiedTokenModalOpen, setUnverifiedTokenModalOpen] =
    useState(false)
  const [unverifiedToken, setUnverifiedToken] = useState<Token | undefined>()

  const [internalOpen, setInternalOpen] = useState(false)
  const [open, setOpen] = openState || [internalOpen, setInternalOpen]
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
    let chains =
      relayClient?.chains.sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      ) ?? []

    if (!multiWalletSupportEnabled && context === 'from') {
      chains = chains.filter((chain) => chain.vmType === 'evm')
    }
    return chains
  }, [relayClient?.chains, multiWalletSupportEnabled])

  const chainFilterOptions =
    context === 'from'
      ? configuredChains?.filter(
          (chain) =>
            chain.vmType === 'evm' ||
            chain.id === solana.id ||
            chain.id === bitcoin.id
        )
      : configuredChains

  const configuredChainIds = useMemo(() => {
    if (chainIdsFilter) {
      return chainIdsFilter
    }
    return configuredChains.map((chain) => chain.id)
  }, [configuredChains, chainIdsFilter])

  const useDefaultTokenList =
    debouncedTokenSearchValue === '' &&
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

  const { data: externalTokenList, isLoading: isLoadingExternalTokenList } =
    useTokenList(
      relayClient?.baseApiUrl,
      {
        chainIds: chainFilter.id ? [chainFilter.id] : configuredChainIds,
        address: isAddress(debouncedTokenSearchValue)
          ? debouncedTokenSearchValue
          : undefined,
        term: !isAddress(debouncedTokenSearchValue)
          ? debouncedTokenSearchValue
          : undefined,
        defaultList: false,
        limit: 20,
        ...(tokenListQuery ? { tokens: tokenListQuery } : {}),
        useExternalSearch: true
      },
      {
        enabled: !!debouncedTokenSearchValue
      }
    )

  const {
    data: duneTokens,
    balanceMap: tokenBalances,
    isLoading: isLoadingDuneBalances
  } = useDuneBalances(
    address &&
      address !== evmDeadAddress &&
      address !== solDeadAddress &&
      address !== bitcoinDeadAddress &&
      isValidAddress
      ? address
      : undefined
  )

  const restrictedTokenAddresses = restrictedTokensList?.map((token) =>
    token.address.toLowerCase()
  )

  const duneTokenBalances = duneTokens?.balances?.filter((balance) => {
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

  const combinedTokenList = useMemo(() => {
    if (!tokenList) return externalTokenList
    if (!externalTokenList) return tokenList

    const mergedList = [...tokenList]

    externalTokenList.forEach((currencyList) => {
      const externalCurrency = currencyList[0]

      if (externalCurrency) {
        const alreadyExists = mergedList.some((list) =>
          list.some(
            (existingCurrency) =>
              existingCurrency.chainId === externalCurrency.chainId &&
              existingCurrency?.address?.toLowerCase() ===
                externalCurrency?.address?.toLowerCase()
          )
        )
        if (!alreadyExists) {
          mergedList.push(currencyList)
        }
      }
    })

    return mergedList
  }, [tokenList, externalTokenList])

  // Filter out unconfigured chains and append Relay Chain to each currency
  const enhancedCurrencyList = useMemo(() => {
    const _tokenList =
      combinedTokenList && (combinedTokenList as any).length
        ? (combinedTokenList as CurrencyList[])
        : undefined

    const filteredSuggestedTokens = chainFilter.id
      ? suggestedTokens
          ?.map((tokenList) =>
            tokenList.filter((token) => token.chainId === chainFilter.id)
          )
          .filter((tokenList) => tokenList.length > 0)
      : suggestedTokens

    let list =
      useDefaultTokenList &&
      filteredSuggestedTokens &&
      filteredSuggestedTokens.length > 0
        ? filteredSuggestedTokens
        : combinedTokenList

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
        .filter(
          (currency) =>
            currency !== undefined &&
            (context !== 'from' ||
              currency.vmType !== 'svm' ||
              //@ts-ignore: todo remove once we have api support
              currency.vmType !== 'bvm' ||
              currency.chainId === solana.id ||
              currency.chainId === bitcoin.id) &&
            (context !== 'from' ||
              multiWalletSupportEnabled ||
              currency.vmType !== 'svm' ||
              //@ts-ignore: todo remove once we have api support
              currency.vmType !== 'bvm')
        )
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
    combinedTokenList,
    suggestedTokens,
    useDefaultTokenList,
    configuredChains,
    tokenBalances,
    multiWalletSupportEnabled,
    chainFilter
  ])

  const isLoading = isLoadingSuggestedTokens || isLoadingTokenList

  const selectedTokenCurrencyList = useMemo(() => {
    const fromEnhancedList = enhancedCurrencyList?.find((currencyList) =>
      currencyList?.chains?.some((chain) =>
        chain?.chainId === token?.chainId && chain?.vmType === 'evm'
          ? chain?.address?.toLowerCase() === token?.address?.toLowerCase()
          : chain?.address === token?.address
      )
    )

    const fromSelectedList =
      selectedCurrencyList?.chains?.[0]?.chainId === token?.chainId &&
      selectedCurrencyList?.chains?.[0].name?.toLowerCase() ===
        token?.name?.toLowerCase()
        ? selectedCurrencyList
        : undefined

    return fromEnhancedList || fromSelectedList
  }, [enhancedCurrencyList, selectedCurrencyList, token])

  // Fetch currency list if there is no selectedTokenCurrencyList
  const { data: fetchedCurrencyList } = useTokenList(
    relayClient?.baseApiUrl,
    {
      chainIds: token?.chainId ? [token.chainId] : [],
      address: token?.address,
      limit: 1
    },
    {
      enabled:
        !selectedTokenCurrencyList && !!token?.chainId && !!token?.address
    }
  )

  // Update selectedTokenCurrencyList when fetchedCurrencyList is returned
  useEffect(() => {
    if (
      selectedCurrencyList === undefined &&
      fetchedCurrencyList &&
      fetchedCurrencyList.length > 0
    ) {
      const currencyList = fetchedCurrencyList[0]
      const enhancedList: EnhancedCurrencyList = {
        chains: currencyList.map((currency) => ({
          ...currency,
          relayChain: configuredChains.find(
            (chain) => chain.id === currency.chainId
          ) as RelayChain,
          balance: tokenBalances
            ? tokenBalances[`${currency.chainId}:${currency.address}`]
            : undefined
        }))
      }

      setSelectedCurrencyList(enhancedList)
    }
  }, [
    selectedTokenCurrencyList,
    fetchedCurrencyList,
    configuredChains,
    tokenBalances
  ])

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
          logoURI: currency.metadata?.logoURI ?? '',
          verified: currency.metadata?.verified
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

  useEffect(() => {
    if (!open) {
      resetState()
    } else {
      const chain = relayClient?.chains?.find(
        (chain) => chain.id === token?.chainId
      )
      setChainFilter(
        chain ?? {
          id: undefined,
          name: 'All'
        }
      )
      if (type === 'chain') {
        setCurrencyList(selectedTokenCurrencyList as EnhancedCurrencyList)
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
                type,
                direction: context === 'from' ? 'input' : 'output'
              }
            )
            setOpen(openChange)
          }}
          showCloseButton={true}
          trigger={trigger}
          css={{
            p: '4',
            sm: {
              minWidth:
                size === 'desktop'
                  ? !chainIdsFilter || chainIdsFilter.length > 1
                    ? 568
                    : 378
                  : 400,
              maxWidth:
                size === 'desktop' &&
                (!chainIdsFilter || chainIdsFilter.length > 1)
                  ? 568
                  : 378
            }
          }}
        >
          <Flex
            direction="column"
            align="center"
            css={{
              width: '100%',
              height: '100%',
              gap: '3',
              position: 'relative'
            }}
          >
            {tokenSelectorStep === TokenSelectorStep.SetCurrency ? (
              <SetCurrencyStep
                size={size}
                inputElement={inputElement}
                setInputElement={setInputElement}
                tokenSearchInput={tokenSearchInput}
                setTokenSearchInput={setTokenSearchInput}
                chainIdsFilter={chainIdsFilter}
                chainFilterOptions={chainFilterOptions}
                chainFilter={chainFilter}
                setChainFilter={setChainFilter}
                isLoading={isLoading}
                isLoadingExternalTokenList={isLoadingExternalTokenList}
                isLoadingDuneBalances={isLoadingDuneBalances}
                enhancedCurrencyList={
                  enhancedCurrencyList as EnhancedCurrencyList[]
                }
                token={token}
                selectToken={selectToken}
                setCurrencyList={setCurrencyList}
                onAnalyticEvent={onAnalyticEvent}
                setUnverifiedToken={setUnverifiedToken}
                setUnverifiedTokenModalOpen={setUnverifiedTokenModalOpen}
              />
            ) : null}
            {tokenSelectorStep === TokenSelectorStep.SetChain ? (
              <SetChainStep
                token={token}
                context={context}
                setTokenSelectorStep={setTokenSelectorStep}
                setInputElement={setInputElement}
                chainSearchInput={chainSearchInput}
                setChainSearchInput={setChainSearchInput}
                selectToken={selectToken}
                setUnverifiedToken={setUnverifiedToken}
                setUnverifiedTokenModalOpen={setUnverifiedTokenModalOpen}
                selectedCurrencyList={selectedCurrencyList}
                type={type}
                size={size}
                multiWalletSupportEnabled={multiWalletSupportEnabled}
              />
            ) : null}
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
              const currentData = getRelayUiKitData()
              const tokenIdentifier = `${token.chainId}:${token.address}`

              if (
                !currentData.acceptedUnverifiedTokens.includes(tokenIdentifier)
              ) {
                setRelayUiKitData({
                  acceptedUnverifiedTokens: [
                    ...currentData.acceptedUnverifiedTokens,
                    tokenIdentifier
                  ]
                })
              }

              selectToken(token, token.chainId)
              onAnalyticEvent?.(EventNames.UNVERIFIED_TOKEN_ACCEPTED, { token })
            }
            resetState()
            setOpen(false)
            setUnverifiedTokenModalOpen(false)
          }}
        />
      )}
    </>
  )
}

export default TokenSelector
