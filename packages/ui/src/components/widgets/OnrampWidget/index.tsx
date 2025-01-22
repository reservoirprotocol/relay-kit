import type { FC } from 'react'
import { useRelayClient } from '../../../hooks/index.js'
import OnrampWidgetRenderer from './OnrampWidgetRenderer.js'
import { Flex, Text } from '../../primitives/index.js'
import AmountInput from '../../common/AmountInput.js'

type OnrampWidgetProps = {
  defaultWalletAddress?: string
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

const OnrampWidget: FC<OnrampWidgetProps> = ({ defaultWalletAddress }) => {
  const relayClient = useRelayClient()

  return (
    <OnrampWidgetRenderer defaultWalletAddress={defaultWalletAddress}>
      {({ depositAddress, recipient, setRecipient, amount, setAmount }) => {
        const formattedAmount =
          amount === ''
            ? ''
            : amount.endsWith('.')
              ? new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(+amount) + '.'
              : new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0, // Do not force decimal places
                  maximumFractionDigits: amount.includes('.') ? 2 : 0
                }).format(+amount)

        return (
          <div
            className="relay-kit-reset"
            style={{ maxWidth: 400, minWidth: 408, width: '100%' }}
          >
            <Flex
              direction="column"
              css={{
                gap: '2',
                border: 'widget-border',
                width: '100%'
              }}
            >
              <Flex
                direction="column"
                css={{
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: 'widget-card-border-radius',
                  backgroundColor: 'widget-background',
                  border: 'widget-card-border',
                  mb: 'widget-card-section-gutter',
                  p: '4'
                }}
              >
                <Flex justify="between" align="center" css={{ mb: 28 }}>
                  <Text style="subtitle2" color="subtle">
                    You are buying
                  </Text>
                  <div>FIAT SELECTOR</div>
                </Flex>
                <AmountInput
                  value={formattedAmount}
                  setValue={(e) => {
                    setAmount(e)
                  }}
                  onChange={(e) => {
                    const inputValue = (e.target as HTMLInputElement).value
                    const numericValue = inputValue.replace(/[^0-9.]/g, '') // Extract numerical value
                    const regex = /^[0-9]+(\.[0-9]*)?$/
                    if (numericValue === '.' || numericValue.includes(',')) {
                      setAmount('0.')
                    } else if (
                      regex.test(numericValue) ||
                      numericValue === ''
                    ) {
                      setAmount(numericValue)
                    }
                  }}
                  css={{
                    fontWeight: '700',
                    fontSize: 48,
                    lineHeight: '58px',
                    py: 0
                  }}
                />
              </Flex>
            </Flex>
          </div>
        )
      }}
    </OnrampWidgetRenderer>
  )
}

export default OnrampWidget
