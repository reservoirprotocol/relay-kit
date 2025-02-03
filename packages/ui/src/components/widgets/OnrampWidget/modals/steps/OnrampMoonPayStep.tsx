import { lazy, memo, Suspense, useCallback, useEffect, type FC } from 'react'
import { ChainTokenIcon, Flex, Text } from '../../../../primitives/index.js'
import type { FiatCurrency, Token } from '../../../../../types/index.js'
import { OnrampProcessingStep, OnrampStep } from '../OnrampModal.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import { EventNames } from '../../../../../constants/events.js'

type OnrampMoonPayStepProps = {
  step: OnrampStep
  processingStep?: OnrampProcessingStep
  toToken: Token
  fromToken: Token
  fromChain?: RelayChain
  toChain?: RelayChain
  depositAddress?: string
  totalAmount?: string
  fiatCurrency: FiatCurrency
  onAnalyticEvent?: (eventName: string, data?: any) => void
  setStep: (step: OnrampStep) => void
  setProcessingStep: (processingStep: OnrampProcessingStep) => void
  setMoonPayRequestId: (id: string) => void
  moonpayOnUrlSignatureRequested: (url: string) => Promise<string> | void
}

const MoonPayBuyWidget = memo(
  lazy(() =>
    import('@moonpay/moonpay-react').then((module) => ({
      default: module.MoonPayBuyWidget
    }))
  ),
  (a, b) => {
    return (
      (window as any).relayOnrampStep === OnrampStep.Moonpay ||
      (window as any).relayOnrampProcessingStep ===
        OnrampProcessingStep.Finalizing
    )
  }
)

export const OnrampMoonPayStep: FC<OnrampMoonPayStepProps> = ({
  step,
  processingStep,
  toToken,
  fromToken,
  fromChain,
  toChain,
  depositAddress,
  totalAmount,
  fiatCurrency,
  onAnalyticEvent,
  setStep,
  setProcessingStep,
  setMoonPayRequestId,
  moonpayOnUrlSignatureRequested
}) => {
  useEffect(() => {
    if (window) {
      ;(window as any).relayOnrampStep = step
    }
  }, [step])

  useEffect(() => {
    if (window) {
      ;(window as any).relayOnrampProcessingStep = processingStep
    }
  }, [processingStep])

  return (
    <Flex
      direction="column"
      id="onramp-moonpay-step"
      css={{
        width: '100%',
        height: '100%',
        position: step === OnrampStep.Moonpay ? undefined : 'fixed',
        top: step === OnrampStep.Moonpay ? undefined : '-100%'
      }}
    >
      <Text style="h6" css={{ mb: '2' }}>
        Buy {toToken?.symbol} ({toChain?.displayName})
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
          Purchase {fromToken?.symbol} ({fromChain?.displayName}) via your card
          for Relay to convert to {toToken?.symbol} ({toChain?.displayName})
        </Text>
      </Flex>
      <Suspense fallback={<div></div>}>
        <MoonPayBuyWidget
          variant="embedded"
          baseCurrencyCode={fiatCurrency.code}
          quoteCurrencyAmount={`${totalAmount}`}
          lockAmount="true"
          currencyCode={fromChain?.id === 8453 ? 'usdc_base' : 'usdc_optimism'}
          paymentMethod="credit_debit_card"
          walletAddress={depositAddress}
          showWalletAddressForm="false"
          visible
          style={{
            margin: 0,
            width: '100%',
            border: 'none',
            height: 500,
            overflowY: 'scroll'
          }}
          onUrlSignatureRequested={moonpayOnUrlSignatureRequested}
          onTransactionCreated={async (props) => {
            setMoonPayRequestId(props.id)
            if (
              window &&
              (window as any).relayOnrampStep === OnrampStep.Moonpay
            ) {
              setStep(OnrampStep.Processing)
              setProcessingStep(OnrampProcessingStep.Finalizing)
              onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_START, {
                ...props
              })
            }
          }}
          onTransactionCompleted={async (props) => {
            if (
              window &&
              (window as any).relayOnrampStep === OnrampStep.Processing
            ) {
              setProcessingStep(OnrampProcessingStep.Relaying)
              onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_COMPLETE, {
                ...props
              })
            }
          }}
        />
      </Suspense>
    </Flex>
  )
}
