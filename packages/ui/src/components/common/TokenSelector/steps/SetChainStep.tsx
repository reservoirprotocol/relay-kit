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
import type { Chain } from 'viem'

type SetChainStepProps = {
  type?: 'token' | 'chain'
  size: 'mobile' | 'desktop'
  context: 'from' | 'to'
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

  const supportedChains = selectedCurrencyList?.chains || []
  const allChains =
    client?.chains?.filter(
      (chain) =>
        context !== 'from' || (chain.vmType !== 'svm' && chain.id !== 792703809) // filter out solana if from chain
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
        {filteredChains?.map((chain) => {
          const isSupported = chain.isSupported
          const token = isSupported
            ? (chain.currency as Currency)
            : {
                ...chain.relayChain.currency,
                metadata: {
                  logoURI: `https://assets.relay.link/icons/currencies/${chain.relayChain.currency?.id}.png`
                }
              }

          const decimals = chain?.currency?.balance?.decimals ?? 18
          const compactBalance = Boolean(
            chain?.currency?.balance?.amount &&
              decimals &&
              chain?.currency.balance.amount.toString().length - decimals > 4
          )

          return (
            <Button
              key={chain.id}
              color="ghost"
              onClick={() => {
                selectToken(token, chain.id)
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
          )
        })}
      </Flex>
    </>
  )
}
