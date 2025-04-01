import { type FC, useState, useMemo } from 'react'
import { Dropdown, DropdownMenuItem } from '../../primitives/Dropdown.js'
import { Button, Flex, Text, Input, Box } from '../../primitives/index.js'
import ChainIcon from '../../primitives/ChainIcon.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons'
import type { ChainVM, RelayChain } from '@reservoir0x/relay-sdk'
import AllChainsLogo from '../../../img/AllChainsLogo.js'
import { TagPill } from './TagPill.js'
import Fuse from 'fuse.js'
import { groupChains } from '../../../utils/tokenSelector.js'

export type ChainFilterValue =
  | RelayChain
  | { id: undefined; name: string; vmType?: ChainVM }

type Props = {
  options: ChainFilterValue[]
  value: ChainFilterValue
  onSelect: (value: ChainFilterValue) => void
  popularChainIds?: number[]
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['id', 'name', 'displayName']
}

const ChainFilter: FC<Props> = ({
  options,
  value,
  onSelect,
  popularChainIds
}) => {
  const [open, setOpen] = useState(false)
  const [chainSearchInput, setChainSearchInput] = useState('')
  const chainFuse = new Fuse(options, fuseSearchOptions)

  const { allChainsOption, popularChains, alphabeticalChains } = useMemo(
    () => groupChains(options, popularChainIds),
    [options, popularChainIds]
  )

  const filteredChains = useMemo(() => {
    if (chainSearchInput.trim() === '') {
      return null
    }
    const results = chainFuse.search(chainSearchInput)
    const uniqueChains = new Map()
    results.forEach((result) => {
      if (!uniqueChains.has(result.item.id)) {
        uniqueChains.set(result.item.id, result.item)
      }
    })
    return Array.from(uniqueChains.values())
  }, [chainSearchInput, chainFuse])

  return (
    <Dropdown
      open={open}
      onOpenChange={(open) => setOpen(open)}
      trigger={
        <Button
          aria-label={`Chain filter`}
          color="ghost"
          size="none"
          css={{
            gap: '2',
            height: 40,
            width: '100%',
            px: '4 !important',
            cursor: 'pointer',
            display: 'flex',
            alignContent: 'center',
            lineHeight: '20px',
            backgroundColor: 'dropdown-background',
            borderRadius: 'dropdown-border-radius'
          }}
        >
          <Flex align="center" css={{ gap: '2' }}>
            {value.id ? (
              <ChainIcon
                chainId={value.id}
                width={20}
                height={20}
                css={{ borderRadius: 4, overflow: 'hidden' }}
              />
            ) : (
              <AllChainsLogo style={{ width: 20, height: 20 }} />
            )}
            <Text style="subtitle1">
              {('displayName' in value && value.displayName) || value.name}
            </Text>
          </Flex>
          <Text
            style="body1"
            css={{
              color: 'gray9',
              marginLeft: 'auto',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              width: 12
            }}
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </Text>
        </Button>
      }
      contentProps={{
        align: 'start',
        avoidCollisions: false,
        css: {
          p: 0,
          width: 'var(--radix-dropdown-menu-trigger-width)',
          minWidth: 'var(--radix-dropdown-menu-trigger-width)',
          mx: '0'
        },
        style: {
          width: 'var(--radix-popper-anchor-width)',
          minWidth: 'var(--radix-popper-anchor-width)'
        }
      }}
    >
      <Flex direction="column" css={{ p: '2' }}>
        <Input
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
          containerCss={{
            width: '100%',
            height: 40,
            mb: '2'
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
          onKeyDown={(e) => e.stopPropagation()}
        />
        <Flex
          direction="column"
          css={{ overflowY: 'scroll', borderRadius: 8, maxHeight: 290 }}
        >
          {filteredChains ? (
            filteredChains.length > 0 ? (
              filteredChains.map((chain, idx) => {
                const tag = 'tags' in chain ? chain.tags?.[0] : undefined
                return (
                  <DropdownMenuItem
                    key={chain.id?.toString() ?? 'all-chains'}
                    onClick={() => {
                      setOpen(false)
                      onSelect(chain)
                      setChainSearchInput('')
                    }}
                    css={{
                      p: '2'
                    }}
                  >
                    <ChainFilterRow chain={chain} tag={tag} />
                  </DropdownMenuItem>
                )
              })
            ) : (
              <Text style="body1" css={{ p: '2', textAlign: 'center' }}>
                No results.
              </Text>
            )
          ) : (
            <>
              {allChainsOption && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setOpen(false)
                      onSelect(allChainsOption)
                      setChainSearchInput('')
                    }}
                    css={{ p: '2' }}
                  >
                    <ChainFilterRow chain={allChainsOption} />
                  </DropdownMenuItem>
                </>
              )}

              {popularChains.length > 0 && (
                <>
                  <Text
                    style="subtitle2"
                    color="subtle"
                    css={{ px: '2', py: '1' }}
                  >
                    Popular Chains
                  </Text>
                  {popularChains.map((chain) => {
                    const tag = 'tags' in chain ? chain.tags?.[0] : undefined
                    return (
                      <DropdownMenuItem
                        key={chain.id?.toString() ?? 'all-chains'}
                        onClick={() => {
                          setOpen(false)
                          onSelect(chain)
                          setChainSearchInput('')
                        }}
                        css={{ p: '2' }}
                      >
                        <ChainFilterRow chain={chain} tag={tag} />
                      </DropdownMenuItem>
                    )
                  })}
                </>
              )}

              <Text style="subtitle2" color="subtle" css={{ px: '2', py: '1' }}>
                Chains A-Z
              </Text>
              {alphabeticalChains.map((chain) => {
                const tag = 'tags' in chain ? chain.tags?.[0] : undefined
                return (
                  <DropdownMenuItem
                    key={chain.id?.toString() ?? 'all-chains'}
                    onClick={() => {
                      setOpen(false)
                      onSelect(chain)
                      setChainSearchInput('')
                    }}
                    css={{ p: '2' }}
                  >
                    <ChainFilterRow chain={chain} tag={tag} />
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
        </Flex>
      </Flex>
    </Dropdown>
  )
}

type ChainFilterRowProps = {
  chain: ChainFilterValue
  tag?: string
}

const ChainFilterRow: FC<ChainFilterRowProps> = ({ chain, tag }) => {
  return (
    <Flex
      align="center"
      css={{
        gap: '2',
        cursor: 'pointer',
        flexShrink: 0,
        alignContent: 'center',
        width: '100%'
      }}
    >
      {chain.id ? (
        <ChainIcon chainId={chain.id} square width={24} height={24} />
      ) : (
        <AllChainsLogo style={{ width: 24, height: 24 }} />
      )}
      <Text style="subtitle2">
        {('displayName' in chain && chain.displayName) || chain.name}
      </Text>
      {tag && <TagPill tag={tag} />}
    </Flex>
  )
}

export default ChainFilter
