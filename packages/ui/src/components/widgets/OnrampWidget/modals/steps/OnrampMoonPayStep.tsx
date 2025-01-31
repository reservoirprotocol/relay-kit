import { lazy, Suspense, type FC } from 'react'
import { ChainTokenIcon, Flex, Text } from '../../../../primitives/index.js'
import type { FiatCurrency, Token } from '../../../../../types/index.js'
import { OnrampProcessingStep, OnrampStep } from '../OnrampModal.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import { EventNames } from '../../../../../constants/events.js'

type OnrampMoonPayStepProps = {
  step: OnrampStep
  toToken: Token
  fromToken: Token
  fromChain?: RelayChain
  depositAddress?: string
  totalAmount?: string
  fiatCurrency: FiatCurrency
  onAnalyticEvent?: (eventName: string, data?: any) => void
  setStep: (step: OnrampStep) => void
  setProcessingStep: (processingStep: OnrampProcessingStep) => void
  setMoonPayRequestId: (id: string) => void
  moonpayOnUrlSignatureRequested: (url: string) => Promise<string> | void
}

const MoonPayBuyWidget = lazy(() =>
  import('@moonpay/moonpay-react').then((module) => ({
    default: module.MoonPayBuyWidget
  }))
)

export const OnrampMoonPayStep: FC<OnrampMoonPayStepProps> = ({
  step,
  toToken,
  fromToken,
  fromChain,
  depositAddress,
  totalAmount,
  fiatCurrency,
  onAnalyticEvent,
  setStep,
  setProcessingStep,
  setMoonPayRequestId,
  moonpayOnUrlSignatureRequested
}) => {
  return (
    <Flex
      direction="column"
      css={{
        width: '100%',
        height: '100%',
        display: step === OnrampStep.Moonpay ? 'flex' : 'none'
      }}
    >
      <Text style="h6" css={{ mb: '2' }}>
        Buy {toToken?.name}
      </Text>
      <Flex
        align="center"
        css={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'widget-card-border-radius',
          '--borderColor': 'colors.subtle-border-color',
          border: '1px solid var(--borderColor)',
          p: '4',
          gap: 2
        }}
      >
        <ChainTokenIcon
          chainId={fromToken?.chainId}
          tokenlogoURI={fromToken?.logoURI}
          css={{ width: 32, height: 32 }}
        />
        <Text style="subtitle2">
          Purchase {fromToken?.symbol} via your card for Relay to convert to{' '}
          {toToken?.symbol}
        </Text>
      </Flex>
      <Suspense fallback={<div></div>}>
        {MoonPayBuyWidget ? (
          <MoonPayBuyWidget
            variant="embedded"
            baseCurrencyCode={fiatCurrency.code}
            quoteCurrencyAmount={`${totalAmount}`}
            lockAmount="true"
            currencyCode={
              fromChain?.id === 8453 ? 'usdc_base' : 'usdc_optimism'
            }
            paymentMethod="credit_debit_card"
            walletAddress={depositAddress}
            showWalletAddressForm="false"
            visible
            style={{
              margin: 0,
              width: '100%',
              border: 'none'
            }}
            onUrlSignatureRequested={moonpayOnUrlSignatureRequested}
            onTransactionCreated={async (props) => {
              setMoonPayRequestId(props.id)
              if (step === OnrampStep.Moonpay) {
                setStep(OnrampStep.Processing)
                setProcessingStep(OnrampProcessingStep.Finalizing)
                onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_START, {
                  ...props
                })
              }
            }}
            onTransactionCompleted={async (props) => {
              if (step === OnrampStep.Processing) {
                setProcessingStep(OnrampProcessingStep.Relaying)
                onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_COMPLETE, {
                  ...props
                })
              }
            }}
          />
        ) : null}
      </Suspense>
    </Flex>
  )
}
