import type { FC, ChangeEvent } from 'react'
import { useState, useEffect, useRef } from 'react'
import { Dropdown } from '../primitives/Dropdown.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { Button, Flex, Input, Text, Box } from '../primitives/index.js'
import Tooltip from '../primitives/Tooltip.js'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../primitives/Tabs.js'
import {
  getSlippageRating,
  ratingToColor,
  type SlippageToleranceMode
} from '../../utils/slippage.js'

type SlippageToleranceConfigProps = {
  slippageTolerance: string | undefined
  setSlippageTolerance: (slippageTolerance: string | undefined) => void
}

export const SlippageToleranceConfig: FC<SlippageToleranceConfigProps> = ({
  slippageTolerance,
  setSlippageTolerance
}) => {
  const [mode, setMode] = useState<SlippageToleranceMode>('Auto')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && mode === 'Custom') {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [open, mode])

  const slippageRating = slippageTolerance
    ? getSlippageRating(slippageTolerance)
    : undefined
  const slippageRatingColor = slippageRating
    ? ratingToColor[slippageRating]
    : undefined

  const handleInputChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '')

    // Handle empty input
    if (sanitizedValue === '') {
      setSlippageTolerance(undefined)
      return
    }

    // Handle single decimal point input
    if (sanitizedValue === '.') {
      setSlippageTolerance('0.')
      return
    }

    // Validate format (numbers with up to 2 decimal places)
    if (!/^[0-9]*\.?[0-9]{0,2}$/.test(sanitizedValue)) {
      return
    }

    // Prevent multiple leading zeros unless followed by a decimal
    if (
      sanitizedValue.startsWith('0') &&
      sanitizedValue.length > 1 &&
      sanitizedValue[1] !== '.'
    ) {
      return
    }

    const numValue = parseFloat(sanitizedValue)
    if (!isNaN(numValue)) {
      if (numValue > 100) {
        setSlippageTolerance('100')
        return
      }
    }

    setSlippageTolerance(sanitizedValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const handleClose = () => {
    if (slippageTolerance === undefined) {
      return
    }
    if (mode === 'Auto') {
      setSlippageTolerance(undefined)
    }
    const value = parseFloat(slippageTolerance)
    if (isNaN(value) || value < 0.1) {
      setSlippageTolerance(undefined)
    }
  }

  return (
    <div className="relay-kit-reset">
      <Dropdown
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            handleClose()
          }
        }}
        trigger={
          <Button
            color="ghost"
            size="none"
            css={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1',
              bg: 'subtle-background-color',
              color: slippageRatingColor ?? 'gray9',
              p: '2',
              borderRadius: 12,
              border: 'none',
              height: '36px',
              px: '10px'
            }}
          >
            {open === false && slippageTolerance && (
              <Text style="subtitle2" css={{ color: slippageRatingColor }}>
                {slippageTolerance}%
              </Text>
            )}
            <FontAwesomeIcon icon={faGear} />
          </Button>
        }
        contentProps={{
          align: 'end',
          sideOffset: 5,
          css: { maxWidth: 188, mx: 0 }
        }}
      >
        <Flex
          direction="column"
          css={{ width: '100%', gap: '2', maxWidth: 188 }}
        >
          <Flex direction="row" css={{ gap: '1', alignItems: 'center' }}>
            <Text style="subtitle3">Max Slippage</Text>
            <Tooltip
              content={
                <Text
                  style="tiny"
                  css={{ display: 'inline-block', maxWidth: 190 }}
                >
                  If the price exceeds the maximum slippage percentage, the
                  transaction will revert.
                </Text>
              }
            >
              <Box css={{ color: 'gray8' }}>
                <FontAwesomeIcon icon={faInfoCircle} width={14} height={14} />
              </Box>
            </Tooltip>
          </Flex>

          <TabsRoot
            value={mode}
            onValueChange={(value) => {
              setMode(value as SlippageToleranceMode)
              if (value === 'Auto') {
                setSlippageTolerance(undefined)
              }
            }}
            css={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: '2'
            }}
          >
            <TabsList css={{ width: '100%' }}>
              <TabsTrigger value="Auto" css={{ width: '50%' }}>
                Auto
              </TabsTrigger>
              <TabsTrigger value="Custom" css={{ width: '50%' }}>
                Custom
              </TabsTrigger>
            </TabsList>

            <TabsContent value="Auto" css={{ width: '100%' }}>
              <Text style="body3" color="subtle" css={{ lineHeight: '14px' }}>
                We'll set the slippage automatically to minimize the failure
                rate.
              </Text>
            </TabsContent>

            <TabsContent
              value="Custom"
              css={{
                display: 'flex',
                width: '100%',
                overflow: 'hidden',
                flexDirection: 'column',
                gap: '1'
              }}
            >
              <Flex
                css={{ display: 'flex', width: '100%', position: 'relative' }}
              >
                <Input
                  ref={inputRef}
                  value={slippageTolerance || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  onBlur={handleClose}
                  placeholder="2"
                  css={{
                    height: '36px',
                    pr: '28px !important',
                    border: 'none',
                    textAlign: 'right',
                    width: '100%',
                    color: slippageRatingColor
                  }}
                />
                <Box
                  css={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  %
                </Box>
              </Flex>
              {slippageRating === 'very-high' ? (
                <Text style="body3" css={{ color: 'red11' }}>
                  Very high slippage.
                </Text>
              ) : null}
              {slippageRating === 'high' ? (
                <Text style="body3" css={{ color: 'amber11' }}>
                  High slippage.
                </Text>
              ) : null}
            </TabsContent>
          </TabsRoot>
        </Flex>
      </Dropdown>
    </div>
  )
}
