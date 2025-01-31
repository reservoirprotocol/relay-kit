import { useMemo, useState, type FC } from 'react'
import {
  AccessibleList,
  AccessibleListItem,
  Box,
  Button,
  Flex,
  Input,
  Text
} from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { Modal } from '../../../../components/common/Modal.js'
import type { FiatCurrency } from '../../../../types/index.js'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import Fuse from 'fuse.js'

type Props = {
  fiatCurrencies: FiatCurrency[]
  fiatCurrency: FiatCurrency
  setFiatCurrency: (fiatCurrency: FiatCurrency) => void
}

const fuseSearchOptions = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ['name', 'code']
}

const FiatCurrencyModal: FC<Props> = ({
  fiatCurrency,
  setFiatCurrency,
  fiatCurrencies
}) => {
  const [open, setOpen] = useState(false)
  const [currencySearchInput, setCurrencySearchInput] = useState('')
  const sortedFiatCurrencies = useMemo(
    () => fiatCurrencies.sort((a, b) => a.name.localeCompare(b.name)),
    [fiatCurrencies]
  )
  const currenciesFuse = new Fuse(sortedFiatCurrencies, fuseSearchOptions)
  const filteredCurrencies = useMemo(() => {
    if (currencySearchInput.trim() !== '') {
      return currenciesFuse
        .search(currencySearchInput)
        .map((result) => result.item)
    } else {
      return sortedFiatCurrencies
    }
  }, [currencySearchInput, currenciesFuse])

  return (
    <Modal
      trigger={
        <Button
          color="white"
          corners="pill"
          css={{
            height: 36,
            minHeight: 36,
            width: 'max-content',
            flexShrink: 0,
            overflow: 'hidden',
            gap: '1',
            display: 'flex',
            alignItems: 'center',
            p: '6px',
            backgroundColor: 'gray2',
            border: 'none',
            _hover: {
              backgroundColor: 'gray3'
            }
          }}
        >
          <img
            alt="currency-icon"
            src={fiatCurrency.icon}
            style={{ width: 16, height: 16, borderRadius: '50%' }}
          />
          <Text style="subtitle2" color="subtle">
            {fiatCurrency.code.toUpperCase()}
          </Text>
          <Box css={{ color: 'gray9', width: 14 }}>
            <FontAwesomeIcon icon={faChevronDown} width={14} />
          </Box>
        </Button>
      }
      open={open}
      onOpenChange={(open) => {
        if (open) {
          // onAnalyticEvent?.(EventNames.ONRAMP_MODAL_OPEN)
        } else {
          // onAnalyticEvent?.(EventNames.ONRAMP_MODAL_CLOSE)
        }
        setOpen(open)
      }}
      css={{
        overflow: 'hidden',
        p: '4',
        maxWidth: '400px !important',
        maxHeight: '450px !important'
      }}
    >
      <Text
        style="h6"
        css={{
          width: '100%',
          textAlign: 'left'
        }}
      >
        Select a currency
      </Text>
      <AccessibleList
        onSelect={(value) => {
          if (value && value !== 'input') {
            const selectedCurrency = sortedFiatCurrencies?.find(
              (currency) => currency.code === value
            )
            if (selectedCurrency) {
              setFiatCurrency(selectedCurrency)
            }
            setOpen(false)
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
            placeholder="Search for a currency"
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
              marginTop: '8px',
              marginBottom: '8px',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
            css={{
              width: '100%',
              _placeholder_parent: {
                textOverflow: 'ellipsis'
              }
            }}
            value={currencySearchInput}
            onChange={(e) => {
              setCurrencySearchInput((e.target as HTMLInputElement).value)
            }}
          />
        </AccessibleListItem>
        {filteredCurrencies.map((currency, i) => {
          const active = fiatCurrency.code === currency.code
          return (
            <AccessibleListItem
              key={currency.code}
              value={currency.code}
              asChild
            >
              <Button
                color="ghost"
                size="none"
                css={{
                  scrollSnapAlign: 'start',
                  p: '2',
                  mb: i + 1 < fiatCurrencies.length ? '1' : 0,
                  display: 'flex',
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
                <Flex align="center" css={{ gap: '2' }}>
                  <img
                    src={currency.icon}
                    alt={`${currency.name} icon`}
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                  />
                  <Flex
                    css={{ gap: '2px', textAlign: 'left' }}
                    direction="column"
                  >
                    <Text style="subtitle2">{currency.name}</Text>
                    <Text style="body3" color="subtle">
                      {currency.code}
                    </Text>
                  </Flex>
                </Flex>
              </Button>
            </AccessibleListItem>
          )
        })}
      </AccessibleList>
    </Modal>
  )
}

export default FiatCurrencyModal
