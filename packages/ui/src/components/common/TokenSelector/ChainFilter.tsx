import { type FC, useState } from 'react'
import { Dropdown, DropdownMenuItem } from '../../primitives/Dropdown.js'
import { Button, Flex, Text } from '../../primitives/index.js'
import ChainIcon from '../../primitives/ChainIcon.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import type { ChainVM, RelayChain } from '@reservoir0x/relay-sdk'
import AllChainsLogo from '../../../img/AllChainsLogo.js'
import { TagPill } from './TagPill.js'

export type ChainFilterValue =
  | RelayChain
  | { id: undefined; name: string; vmType?: ChainVM }

type Props = {
  options: ChainFilterValue[]
  value: ChainFilterValue
  onSelect: (value: ChainFilterValue) => void
}

const ChainFilter: FC<Props> = ({ options, value, onSelect }) => {
  const [open, setOpen] = useState(false)

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
        sideOffset: 12,
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
      <Flex
        direction="column"
        css={{ overflowY: 'scroll', borderRadius: 8, maxHeight: 200 }}
      >
        {options.map((option, idx) => {
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
                <ChainIcon chainId={option.id} square width={24} height={24} />
              ) : (
                <AllChainsLogo style={{ width: 24, height: 24 }} />
              )}
              <Text style="subtitle2">
                {('displayName' in option && option.displayName) || option.name}
              </Text>
              {tag && <TagPill tag={tag} />}
            </DropdownMenuItem>
          )
        })}
      </Flex>
    </Dropdown>
  )
}

export default ChainFilter
