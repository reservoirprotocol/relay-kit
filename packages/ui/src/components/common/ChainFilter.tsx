import React, { type FC, useState } from 'react'
import { type Chain } from 'viem/chains'
import { Dropdown, DropdownMenuItem } from '../primitives/Dropdown'
import { Button, Flex, Text } from '../primitives'
import ChainIcon from '../primitives/ChainIcon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

export type ChainFilterValue = Chain | { id: undefined; name: string }

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
            minW: 70,
            maxWidth: 70,
            px: '4',
            cursor: 'pointer',
            display: 'flex',
            alignContent: 'center',
            lineHeight: '20px',
            backgroundColor: 'gray3'
          }}
        >
          {value.id ? (
            <ChainIcon
              chainId={value.id}
              width={20}
              height={20}
              css={{ borderRadius: 4, overflow: 'hidden' }}
            />
          ) : (
            <Text style="subtitle2" css={{}} ellipsify={true}>
              All
            </Text>
          )}
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
        sideOffset: 12,
        align: 'end',
        style: { maxWidth: 248, padding: 0 }
      }}
    >
      <Flex
        direction="column"
        css={{ overflowY: 'scroll', borderRadius: 8, maxHeight: 200 }}
      >
        {options
          .filter((option) => option.name !== value.name)
          .map((option, idx) => {
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
                  _hover: {
                    backgroundColor: 'gray2'
                  },
                  flexShrink: 0,
                  alignContent: 'center',

                  width: '100%'
                }}
              >
                <ChainIcon
                  css={{
                    height: 20,
                    width: 20,
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                  chainId={option.id}
                />
                <Text style="subtitle2">{option.name}</Text>
              </DropdownMenuItem>
            )
          })}
      </Flex>
    </Dropdown>
  )
}

export default ChainFilter