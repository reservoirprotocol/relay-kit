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

export type ChainFilterValue =
  | RelayChain
  | { id: undefined; name: string; vmType?: ChainVM }

type Props = {
  options: ChainFilterValue[]
  value: ChainFilterValue
  onSelect: (value: ChainFilterValue) => void
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['id', 'name', 'displayName']
}

const ChainFilter: FC<Props> = ({ options, value, onSelect }) => {
  const [open, setOpen] = useState(false)
  const [chainSearchInput, setChainSearchInput] = useState('')
  const chainFuse = new Fuse(options, fuseSearchOptions)

  const filteredChains = useMemo(() => {
    if (chainSearchInput.trim() !== '') {
      return chainFuse.search(chainSearchInput).map((result) => result.item)
    }
    return options
  }, [chainSearchInput, options, chainFuse])

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
          onChange={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setChainSearchInput((e.target as HTMLInputElement).value)
          }}
          onKeyDown={(e) => {
            e.stopPropagation()
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
          }}
          onTouchEnd={(e) => {
            e.stopPropagation()
          }}
        />
        <Flex
          direction="column"
          css={{ overflowY: 'scroll', borderRadius: 8, maxHeight: 290 }}
        >
          {filteredChains.length > 0
            ? filteredChains.map((option, idx) => {
                const tag = 'tags' in option ? option.tags?.[0] : undefined
                return (
                  <DropdownMenuItem
                    aria-label={option.name}
                    key={idx}
                    onClick={() => {
                      setOpen(false)
                      onSelect(option)
                    }}
                    css={{
                      gap: '2',
                      cursor: 'pointer',
                      p: '2',
                      transition: 'backdrop-filter 250ms linear',
                      _hover: {
                        backdropFilter: 'brightness(95%)'
                      },
                      flexShrink: 0,
                      alignContent: 'center',
                      width: '100%'
                    }}
                  >
                    {option.id ? (
                      <ChainIcon
                        chainId={option.id}
                        square
                        width={24}
                        height={24}
                      />
                    ) : (
                      <AllChainsLogo style={{ width: 24, height: 24 }} />
                    )}
                    <Text style="subtitle2">
                      {('displayName' in option && option.displayName) ||
                        option.name}
                    </Text>
                    {tag && <TagPill tag={tag} />}
                  </DropdownMenuItem>
                )
              })
            : chainSearchInput !== '' && (
                <Flex align="center" justify="center" css={{ py: '4' }}>
                  <Text style="body1" css={{ color: 'gray9' }}>
                    No results found
                  </Text>
                </Flex>
              )}
        </Flex>
      </Flex>
    </Dropdown>
  )
}

export default ChainFilter
