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
  recipient?: string
  totalAmount?: string
  fiatCurrency: FiatCurrency
  isPassthrough?: boolean
  moonPayCurrencyCode?: string
  onAnalyticEvent?: (eventName: string, data?: any) => void
  setStep: (step: OnrampStep) => void
  setProcessingStep: (processingStep?: OnrampProcessingStep) => void
  setMoonPayRequestId: (id: string) => void
  moonpayOnUrlSignatureRequested: (url: string) => Promise<string> | void
  onPassthroughSuccess: () => void
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
  recipient,
  totalAmount,
  fiatCurrency,
  isPassthrough,
  moonPayCurrencyCode,
  onAnalyticEvent,
  setStep,
  setProcessingStep,
  setMoonPayRequestId,
  moonpayOnUrlSignatureRequested,
  onPassthroughSuccess
}) => {
  useEffect(() => {
    if (window) {
      ;(window as any).relayOnrampStep = step
    }
    return () => {
      ;(window as any).relayOnrampStep = undefined
    }
  }, [step])

  useEffect(() => {
    if (window) {
      ;(window as any).relayOnrampProcessingStep = processingStep
    }
    return () => {
      ;(window as any).processingStep = undefined
    }
  }, [processingStep])

  useEffect(() => {
    if (window) {
      ;(window as any).relayIsPassthrough = isPassthrough
    }
    return () => {
      ;(window as any).relayIsPassthrough = undefined
    }
  }, [isPassthrough])

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
        {!isPassthrough
          ? `Buy ${toToken?.symbol} (${toChain?.displayName})`
          : 'Checkout'}
      </Text>
      {!isPassthrough ? (
        <Flex
          align="center"
          css={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: 'widget-card-border-radius',
            '--borderColor': 'colors.subtle-border-color',
            border: '1px solid var(--borderColor)',
            p: '4',
            gap: 2,
            mb: '2'
          }}
        >
          <ChainTokenIcon
            chainId={fromToken?.chainId}
            tokenlogoURI={fromToken?.logoURI}
            css={{ width: 32, height: 32 }}
          />
          <Text style="subtitle2">
            Purchase {fromToken?.symbol} ({fromChain?.displayName}) via your
            card for Relay to convert to {toToken?.symbol} (
            {toChain?.displayName})
          </Text>
        </Flex>
      ) : null}
      <Suspense fallback={<div></div>}>
        <MoonPayBuyWidget
          variant="embedded"
          baseCurrencyCode={fiatCurrency.code}
          quoteCurrencyAmount={`${totalAmount}`}
          lockAmount="true"
          currencyCode={moonPayCurrencyCode}
          paymentMethod="credit_debit_card"
          walletAddress={!isPassthrough ? depositAddress : recipient}
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
            onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_START, {
              ...props
            })
            if (
              window &&
              (window as any).relayOnrampStep === OnrampStep.Moonpay &&
              !(window as any).relayIsPassthrough
            ) {
              setStep(OnrampStep.Processing)
              setProcessingStep(OnrampProcessingStep.Finalizing)
            } else if (window && (window as any).relayIsPassthrough) {
              setStep(OnrampStep.ProcessingPassthrough)
            }
          }}
          onTransactionCompleted={async (props) => {
            onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_COMPLETE, {
              ...props
            })
            if (
              window &&
              (window as any).relayOnrampStep === OnrampStep.Processing &&
              !(window as any).relayIsPassthrough
            ) {
              setProcessingStep(OnrampProcessingStep.Relaying)
            } else if (window && (window as any).relayIsPassthrough) {
              setProcessingStep(undefined)
              onPassthroughSuccess()
            }
          }}
        />
      </Suspense>
    </Flex>
  )
}
