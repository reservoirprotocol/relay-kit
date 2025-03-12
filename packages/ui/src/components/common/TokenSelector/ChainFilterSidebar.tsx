import { type FC, useRef, useState, useMemo, useEffect } from 'react'
import {
  Flex,
  Box,
  Input,
  ChainIcon,
  Text,
  Button,
  AccessibleList,
  AccessibleListItem
} from '../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import Fuse from 'fuse.js'
import type { ChainFilterValue } from './ChainFilter.js'
import { EventNames } from '../../../constants/events.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import AllChainsLogo from '../../../img/AllChainsLogo.js'

type ChainFilterSidebarProps = {
  options: (RelayChain | { id: undefined; name: string })[]
  value: ChainFilterValue
  onSelect: (value: ChainFilterValue) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['id', 'name', 'displayName']
}

export const ChainFilterSidebar: FC<ChainFilterSidebarProps> = ({
  options,
  value,
  onSelect,
  onAnalyticEvent
}) => {
  const [chainSearchInput, setChainSearchInput] = useState('')
  const chainFuse = new Fuse(options, fuseSearchOptions)

  const filteredChains = useMemo(() => {
    if (chainSearchInput.trim() !== '') {
      return chainFuse.search(chainSearchInput).map((result) => result.item)
    }
    return options
  }, [chainSearchInput, options, chainFuse])

  const activeChainRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (activeChainRef.current) {
      activeChainRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'nearest'
      })
    }
  }, [filteredChains, value])

  return (
    <Flex
      direction="column"
      css={{
        maxWidth: 212,
        flexShrink: 0,
        gap: '1',
        bg: 'gray3',
        borderRadius: 12,
        p: '3'
      }}
    >
      <AccessibleList
        onSelect={(selectedValue) => {
          if (selectedValue) {
            const chain =
              selectedValue === 'all-chains'
                ? { id: undefined, name: 'All Chains' }
                : filteredChains.find(
                    (chain) => chain.id?.toString() === selectedValue
                  )
            if (chain) {
              onSelect(chain)
              onAnalyticEvent?.(EventNames.CURRENCY_STEP_CHAIN_FILTER, {
                chain: chain.name,
                chain_id: chain.id
              })
            }
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
        <AccessibleListItem value="input" asChild>
          <Input
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
            containerCss={{
              width: '100%',
              height: 40,
              scrollSnapAlign: 'start'
            }}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}
            css={{
              width: '100%',
              _placeholder_parent: {
                textOverflow: 'ellipsis'
              },
              '--borderColor': 'colors.subtle-border-color',
              border: '1px solid var(--borderColor)',
              backgroundColor: 'modal-background'
            }}
            value={chainSearchInput}
            onChange={(e) =>
              setChainSearchInput((e.target as HTMLInputElement).value)
            }
          />
        </AccessibleListItem>
        {filteredChains?.map((chain) => {
          const active = value.id === chain.id
          return (
            <AccessibleListItem
              ref={active ? activeChainRef : null}
              key={chain.id?.toString() ?? 'all-chains'}
              value={chain.id?.toString() ?? 'all-chains'}
              asChild
            >
              <Button
                color="ghost"
                size="none"
                ref={active ? activeChainRef : null}
                css={{
                  scrollSnapAlign: 'start',
                  p: '2',
                  display: 'flex',
                  zIndex: 1,
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
                  },
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
                {chain.id ? (
                  <ChainIcon chainId={chain.id} square width={24} height={24} />
                ) : (
                  <AllChainsLogo style={{ width: 24, height: 24 }} />
                )}
                <Text style="subtitle1" ellipsify>
                  {('displayName' in chain && chain.displayName) || chain.name}
                </Text>
              </Button>
            </AccessibleListItem>
          )
        })}
      </AccessibleList>
    </Flex>
  )
}
