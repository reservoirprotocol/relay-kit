import { useState, type FC } from 'react'
import { Box, Button, Flex, Pill, Text } from '../primitives/index.js'
import { Dropdown, DropdownMenuItem } from '../primitives/Dropdown.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { type RelayChain } from '@reservoir0x/relay-sdk'

type Props = {
  supportsExternalLiquidity: boolean
  externalLiquidtySelected: boolean
  onExternalLiquidityChange: (externalLiquiditySelected: boolean) => void
  chain?: RelayChain
}

const SwapRouteSelector: FC<Props> = ({
  supportsExternalLiquidity,
  externalLiquidtySelected,
  onExternalLiquidityChange,
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
            backgroundColor: 'transparent',
            gap: '3',
            px: '4',
            py: '3',
            borderRadius: 'widget-card-border-radius',
            border: 'widget-card-border',
            '&:disabled': {
              cursor: 'default',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }
          }}
          disabled={!(supportsExternalLiquidity || externalLiquidtySelected)}
        >
          <Text style="subtitle2">Route</Text>
          <Pill
            css={{ gap: '2', display: 'flex', alignItems: 'center' }}
            color="gray"
          >
            <Text style="subtitle2">
              {externalLiquidtySelected ? 'Standard' : 'Relay'}
            </Text>
            {supportsExternalLiquidity || externalLiquidtySelected ? (
              <Box css={{ color: 'gray11', width: 14, flexShrink: 0 }}>
                <FontAwesomeIcon icon={faChevronDown} width={14} />
              </Box>
            ) : null}
          </Pill>
        </Button>
      }
    >
      <Flex direction="column" css={{ borderRadius: 8, maxWidth: 260 }}>
        <DropdownMenuItem
          aria-label={'Relay'}
          onClick={() => {
            setOpen(false)
            onExternalLiquidityChange(false)
          }}
          css={{
            gap: '10px',
            cursor: 'pointer',
            pb: '8px',
            transition: 'backdrop-filter 250ms linear',
            _hover: {
              backdropFilter: 'brightness(95%)'
            },
            flexShrink: 0,
            alignItems: 'flex-start',
            width: '100%',
            display: 'flex'
          }}
        >
          <img
            width="26"
            height="26"
            src="https://assets.relay.link/icons/square/1357/light.png"
            style={{ borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}
          />
          <Flex direction="column">
            <Text style="subtitle2">Relay</Text>
            <Text style="body3" color="subtle">
              Instant, max capacity per transaction
            </Text>
          </Flex>
        </DropdownMenuItem>
        {supportsExternalLiquidity || externalLiquidtySelected ? (
          <DropdownMenuItem
            aria-label={'Native Bridge'}
            onClick={() => {
              setOpen(false)
              onExternalLiquidityChange(true)
            }}
            css={{
              gap: '10px',
              cursor: 'pointer',
              transition: 'backdrop-filter 250ms linear',
              _hover: {
                backdropFilter: 'brightness(95%)'
              },
              flexShrink: 0,
              alignItems: 'flex-start',
              width: '100%',
              display: 'flex',
              pt: '8px'
            }}
          >
            <img
              width="26"
              height="26"
              src={chain?.icon?.squaredLight}
              style={{
                borderRadius: 4,
                overflow: 'hidden',
                flexShrink: 0
              }}
            />
            <Flex direction="column">
              <Text style="subtitle2">Native</Text>
              <Text style="body3" color="subtle">
                Standard time (&#62;2m), unlimited transaction capacity
              </Text>
            </Flex>
          </DropdownMenuItem>
        ) : null}
      </Flex>
    </Dropdown>
  )
}

export default SwapRouteSelector
