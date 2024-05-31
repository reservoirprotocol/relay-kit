import { ChangeEvent, FC, useEffect, useMemo, useState } from 'react'
import { Box, Button, Flex, Input, Skeleton, Text } from '../primitives'
import ChainIcon from '../primitives/ChainIcon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faLock,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons'
import { RelayChain } from '@reservoir0x/relay-sdk'
import { formatBN } from '../../utils/numbers'
import { Modal } from './Modal'
import Fuse from 'fuse.js'
import { useMediaQuery } from 'usehooks-ts'
import { Currency } from '../../lib/constants/currencies'
import { useAccount } from 'wagmi'
import { BalanceDisplay } from './BalanceDisplay'

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['name', 'id', 'displayName']
}

type Props = {
  titleText: string
  options: RelayChain[]
  value: RelayChain
  onSelect: (chain: RelayChain) => void
  currency: Currency
  balance?: bigint
  loadingBalance: boolean
  hasInsufficientBalance?: boolean
  locked?: boolean
}

const ChainSelector: FC<Props> = ({
  titleText,
  options,
  value,
  onSelect,
  currency,
  balance,
  loadingBalance,
  hasInsufficientBalance,
  locked
}) => {
  const isSmallDevice = useMediaQuery('(max-width: 600px)')
  const [open, setOpen] = useState(false)
  const [chains, setChains] = useState(options)
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(
    null
  )
  const supportedCurrencies = useMemo(() => {
    return [value?.currency, ...(value?.erc20Currencies ?? [])]
  }, [value?.currency, value?.erc20Currencies])

  const currencyIsSupported =
    supportedCurrencies.some((c) => c?.id === currency.id) ?? false

  useEffect(() => {
    setChains(options)
  }, [open, options])

  useEffect(() => {
    if (open && inputElement && !isSmallDevice) {
      inputElement.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inputElement])

  const availableChainIds = chains
    .filter((chain) => {
      const supportedCurrencies = [
        chain?.currency,
        ...(chain?.erc20Currencies ?? [])
      ]
      const currencyIsSupported =
        supportedCurrencies?.some((c) => c?.id === currency.id) ?? false

      return chain.id !== value.id && currencyIsSupported
    }, [])
    .map((chain) => chain.id)

  const unavailableChains = chains.filter(
    (chain) => !availableChainIds.includes(chain.id) && chain.id !== value.id
  )

  const fuse = new Fuse(options || [], fuseSearchOptions)

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target

    if (value.length === 0) {
      setChains(options)
      return
    }

    const results = fuse.search(value)
    const items = results.map((result) => result.item)
    setChains(items)
  }

  return (
    <Modal
      open={open}
      onOpenChange={(openChange) => {
        setOpen(openChange)
      }}
      contentCss={{ p: 0, px: '5', pt: '5' }}
      trigger={
        <Button
          color="ghost"
          size="none"
          aria-label={`Selected ${titleText} chain`}
          css={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            backgroundColor: 'gray1',
            _hover: {
              backgroundColor: 'gray2'
            },
            _disabled: {
              cursor: 'not-allowed',
              backgroundColor: 'gray1',
              _hover: {
                backgroundColor: 'gray1'
              }
            },
            gap: '2',
            cursor: 'pointer',
            p: '12px 12px',
            borderRadius: 12,
            sm: { maxWidth: 180 }
          }}
          disabled={locked}
        >
          <Text style="subtitle2" color="subtle">
            {titleText}
          </Text>
          <Flex
            align="center"
            justify="between"
            css={{
              width: '100%',
              gap: '2'
            }}
          >
            <Flex
              align="center"
              css={{
                gap: '2',
                width: '100%',
                flexShrink: 1,
                overflow: 'hidden',
                opacity: currencyIsSupported ? '1' : '0.5'
              }}
            >
              <ChainIcon chainId={value.id} css={{ height: 20, width: 20 }} />
              <Text style="subtitle1" ellipsify>
                {value.displayName}
              </Text>
            </Flex>
            <Text
              style="body1"
              css={{
                color: 'gray9',
                width: 14,
                flexShrink: 0
              }}
            >
              <FontAwesomeIcon
                icon={locked ? faLock : faChevronDown}
                size="lg"
              />
            </Text>
          </Flex>

          {currencyIsSupported ? (
            <BalanceDisplay
              isLoading={loadingBalance}
              balance={balance}
              decimals={currency.decimals}
              symbol={currency.symbol}
              hasInsufficientBalance={hasInsufficientBalance}
            />
          ) : (
            <Text style="subtitle3" color="subtle">
              {currency.symbol} not available
            </Text>
          )}
        </Button>
      }
    >
      <Flex
        direction="column"
        css={{ width: '100%', height: '100%', gap: '3' }}
      >
        <Text style="h5">Select a chain</Text>
        <Input
          ref={(element) => {
            setInputElement(element)
          }}
          placeholder="Search for a chain"
          icon={
            <Box css={{ color: 'gray9', pt: '1' }}>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                width={16}
                height={16}
              />
            </Box>
          }
          css={{
            width: '100%',
            _placeholder_parent: {
              textOverflow: 'ellipsis'
            }
          }}
          onChange={(e) => handleSearch(e)}
        />
        <Flex
          direction="column"
          css={{ height: 350, overflowY: 'auto', pb: '2', gap: '2' }}
        >
          {chains
            .filter((chain) => availableChainIds.includes(chain.id))
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .map((chain) => {
              return (
                <Button
                  color="ghost"
                  key={chain.id}
                  onClick={(e) => {
                    setOpen(false)
                    onSelect(chain)
                  }}
                  css={{
                    gap: '2',
                    cursor: 'pointer',
                    px: '4',
                    py: '2',
                    _hover: {
                      backgroundColor: 'gray3'
                    },
                    flexShrink: 0,
                    alignContent: 'center',
                    display: 'flex',
                    width: '100%'
                  }}
                >
                  <ChainIcon
                    css={{ height: 30, width: 30 }}
                    chainId={chain.id}
                  />
                  <Text style="h6">{chain.displayName}</Text>
                </Button>
              )
            })}
          {unavailableChains.length > 0 ? (
            <Text style="subtitle3" css={{ px: '4' }}>
              {currency.symbol} not available
            </Text>
          ) : null}
          {unavailableChains
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .map((chain) => {
              return (
                <Button
                  color="ghost"
                  key={chain.id}
                  onClick={(e) => {
                    setOpen(false)
                    onSelect(chain)
                  }}
                  css={{
                    gap: '2',
                    cursor: 'pointer',
                    px: '4',
                    py: '2',
                    _hover: {
                      backgroundColor: 'gray3'
                    },
                    flexShrink: 0,
                    alignContent: 'center',
                    display: 'flex',
                    width: '100%'
                  }}
                >
                  <ChainIcon
                    css={{ height: 30, width: 30, filter: 'grayscale(1)' }}
                    chainId={chain.id}
                  />
                  <Text style="h6" color="subtle">
                    {chain.displayName}
                  </Text>
                </Button>
              )
            })}
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ChainSelector
