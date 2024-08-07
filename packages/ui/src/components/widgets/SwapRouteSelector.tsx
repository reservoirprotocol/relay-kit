import { useState, type FC } from 'react'
import { Box, Button, Flex, Text } from '../primitives/index.js'
import { Dropdown, DropdownMenuItem } from '../primitives/Dropdown.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { ASSETS_RELAY_API, type RelayChain } from '@reservoir0x/relay-sdk'

type Props = {
  supportsExternalLiquidity: boolean
  externalLiquidtySelected: boolean
  onExternalLiquidityChange: (externalLiquiditySelected: boolean) => void
  chainId: number
  chain?: RelayChain
}

const SwapRouteSelector: FC<Props> = ({
  supportsExternalLiquidity,
  externalLiquidtySelected,
  onExternalLiquidityChange,
  chainId,
  chain
}) => {
  const [open, setOpen] = useState(false)
  const chainName = chain?.displayName ?? ''
  return (
    <Dropdown
      open={open}
      onOpenChange={(open) => {
        if (supportsExternalLiquidity || externalLiquidtySelected) {
          setOpen(open)
        }
      }}
      contentProps={{
        sideOffset: 12,
        align: 'end',
        css: {
          maxWidth: 248,
          minWidth: 200,
          p: 0,
          overflow: 'hidden',
          borderRadius: 12
        }
      }}
      trigger={
        <Button
          color="ghost"
          size="none"
          css={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'widget-card-background',
            gap: '3',
            p: '12px 12px',
            borderRadius: 'widget-card-border-radius',
            border: 'widget-card-border',
            my: '3',
            '&:disabled': {
              cursor: 'default',
              backgroundColor: 'widget-card-background',
              '&:hover': {
                backgroundColor: 'widget-card-background'
              }
            }
          }}
          disabled={!(supportsExternalLiquidity || externalLiquidtySelected)}
        >
          <Text style="subtitle2" color="subtle">
            Route
          </Text>
          <Flex css={{ gap: '2' }} align="center">
            <Flex align="center" css={{ gap: '6px' }}>
              <img
                width="16"
                height="16"
                src={
                  externalLiquidtySelected
                    ? chain?.icon?.squaredLight
                    : 'https://assets.relay.link/icons/square/1357/light.png'
                }
                style={{ borderRadius: 4, overflow: 'hidden' }}
              />
              <Text style="subtitle2">
                {externalLiquidtySelected
                  ? `${chainName} (Standard Bridge)`
                  : 'Relay (Instant)'}
              </Text>
            </Flex>
            {supportsExternalLiquidity || externalLiquidtySelected ? (
              <Box css={{ color: 'gray11', width: 14, flexShrink: 0 }}>
                <FontAwesomeIcon icon={faChevronDown} width={14} />
              </Box>
            ) : null}
          </Flex>
        </Button>
      }
    >
      <Flex direction="column" css={{ borderRadius: 8 }}>
        <DropdownMenuItem
          aria-label={'Relay'}
          onClick={() => {
            setOpen(false)
            onExternalLiquidityChange(false)
          }}
          css={{
            gap: '2',
            cursor: 'pointer',
            p: '4',
            transition: 'backdrop-filter 250ms linear',
            _hover: {
              backdropFilter: 'brightness(95%)'
            },
            flexShrink: 0,
            alignContent: 'center',
            width: '100%',
            display: 'flex'
          }}
        >
          <img
            width="16"
            height="16"
            src="https://assets.relay.link/icons/square/1357/light.png"
            style={{ borderRadius: 4, overflow: 'hidden' }}
          />
          <Text style="subtitle2">Relay (Instant)</Text>
        </DropdownMenuItem>
        {supportsExternalLiquidity || externalLiquidtySelected ? (
          <DropdownMenuItem
            aria-label={'Standard Bridge'}
            onClick={() => {
              setOpen(false)
              onExternalLiquidityChange(true)
            }}
            css={{
              gap: '2',
              cursor: 'pointer',
              p: '4',
              transition: 'backdrop-filter 250ms linear',
              _hover: {
                backdropFilter: 'brightness(95%)'
              },
              flexShrink: 0,
              alignContent: 'center',
              width: '100%',
              display: 'flex'
            }}
          >
            <img
              width="16"
              height="16"
              src={chain?.icon?.squaredLight}
              style={{
                borderRadius: 4,
                overflow: 'hidden'
              }}
            />
            <Text style="subtitle2">{chainName} (Standard Bridge)</Text>
          </DropdownMenuItem>
        ) : null}
      </Flex>
    </Dropdown>
  )
}

export default SwapRouteSelector
