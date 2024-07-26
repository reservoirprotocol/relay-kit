import { useState } from 'react'
import type { Dispatch, FC, SetStateAction } from 'react'
import type { Currency } from '../../../constants/currencies.js'
import { CurrenciesMap } from '../../../constants/currencies.js'
import { Dropdown, DropdownMenuItem } from '../../primitives/Dropdown.js'
import { Button, CurrencyIcon, Flex, Text } from '../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faLock } from '@fortawesome/free-solid-svg-icons'

type CurrencyDropdownProps = {
  hiddenCurrencies: string[]
  currency: Currency
  setCurrency: (currency: Currency) => void
  locked?: boolean
}

export const CurrencyDropdown: FC<CurrencyDropdownProps> = ({
  hiddenCurrencies,
  currency,
  setCurrency,
  locked
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Dropdown
      open={open}
      onOpenChange={(open) => {
        if (!locked) {
          setOpen(open)
        }
      }}
      trigger={
        <Button
          aria-label="Currency selector"
          color="white"
          corners="pill"
          size="none"
          css={{
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            width: 'auto',
            py: 10,
            px: '3',
            border: 'none',
            flexShrink: 0,
            _disabled: {
              cursor: 'not-allowed',
              backgroundColor: 'gray1',
              _hover: {
                backgroundColor: 'gray1'
              }
            }
          }}
          disabled={locked}
        >
          <CurrencyIcon currencyId={currency.id} width={20} height={20} />
          <Text style="subtitle1">{currency.symbol}</Text>
          <Text
            style="body1"
            css={{
              color: 'gray9',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              width: 14,
              flexShrink: 0
            }}
          >
            <FontAwesomeIcon icon={locked ? faLock : faChevronDown} />
          </Text>
        </Button>
      }
      contentProps={{
        sideOffset: 5,
        css: {
          maxWidth: 248,
          padding: 0,
          '--borderColor': 'colors.gray5',
          border: '1px solid var(--borderColor)',
          borderRadius: 12,
          overflow: 'hidden'
        }
      }}
    >
      <Flex direction="column" align="start">
        {Object.values(CurrenciesMap)
          .filter((currency) => !hiddenCurrencies.includes(currency.id))
          .map((currency) => {
            return (
              <DropdownMenuItem
                aria-label={currency.symbol}
                key={currency.id}
                onClick={(e) => {
                  setOpen(false)
                  setCurrency(currency)
                }}
                css={{
                  gap: '2',
                  cursor: 'pointer',
                  px: '4',
                  py: '2',
                  _hover: {
                    backgroundColor: 'gray2'
                  },
                  flexShrink: 0,
                  alignContent: 'center',
                  width: '100%'
                }}
              >
                <CurrencyIcon currencyId={currency.id} width={20} height={20} />
                <Text style="subtitle1">{currency.symbol}</Text>
              </DropdownMenuItem>
            )
          })}
      </Flex>
    </Dropdown>
  )
}
