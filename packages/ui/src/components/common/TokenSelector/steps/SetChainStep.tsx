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

type SetChainStepProps = {
  type?: 'token' | 'chain'
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
  setTokenSelectorStep,
  setInputElement,
  chainSearchInput,
  setChainSearchInput,
  selectToken,
  selectedCurrencyList
}) => {
  const client = useRelayClient()

  const allChains =
    type === 'chain' ? client?.chains : selectedCurrencyList?.chains

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
      </Flex>
    </>
  )
}
