import { useState, type FC, type ReactNode } from 'react'
import { Box, Button, Flex, Text } from '../primitives/index.js'
import { Dropdown, DropdownMenuItem } from '../primitives/Dropdown.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ASSETS_RELAY_API, type RelayChain } from '@reservoir0x/relay-sdk'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

type Props = {
  supportsExternalLiquidity: boolean
  externalLiquidtySelected: boolean
  onExternalLiquidityChange: (externalLiquiditySelected: boolean) => void
  chain?: RelayChain
  canonicalTimeEstimate?: string
  trigger?: ReactNode
}

const SwapRouteSelector: FC<Props> = ({
  supportsExternalLiquidity,
  externalLiquidtySelected,
  onExternalLiquidityChange,
  chain,
  canonicalTimeEstimate,
  trigger
}) => {
  const [open, setOpen] = useState(false)
  return (
    <Dropdown
      open={open}
      onOpenChange={(open) => {
        if (supportsExternalLiquidity || externalLiquidtySelected) {
          setOpen(open)
        }
      }}
      contentProps={{
        sideOffset: 8,
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
        trigger ?? (
          <Button
            color="ghost"
            size="none"
            css={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '3',
              p: '12',
              borderRadius: 'widget-card-border-radius',

              '&:disabled': {
                cursor: 'default',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              },
              _focusVisible: {
                boxShadow: 'none'
              }
            }}
            disabled={!(supportsExternalLiquidity || externalLiquidtySelected)}
          >
            <Text style="subtitle2">Route</Text>
            <Flex css={{ gap: '2', alignItems: 'center' }}>
              <Text style="subtitle2">
                {externalLiquidtySelected ? 'Native' : 'Relay'}
              </Text>
              {supportsExternalLiquidity || externalLiquidtySelected ? (
                <Box css={{ color: 'gray11', width: 14, flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faChevronRight} width={14} />
                </Box>
              ) : null}
            </Flex>
          </Button>
        )
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
            src={`${ASSETS_RELAY_API}/icons/square/1357/light.png`}
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
                {canonicalTimeEstimate
                  ? `Standard time ~${canonicalTimeEstimate}, unlimited transaction capacity`
                  : 'Unlimited transaction capacity'}
              </Text>
            </Flex>
          </DropdownMenuItem>
        ) : null}
      </Flex>
    </Dropdown>
  )
}

export default SwapRouteSelector
