import { lazy, memo, Suspense, useCallback, useEffect, type FC } from 'react'
import {
  Box,
  ChainTokenIcon,
  Flex,
  Text
} from '../../../../primitives/index.js'
import type { FiatCurrency, Token } from '../../../../../types/index.js'
import { OnrampProcessingStep, OnrampStep } from '../OnrampModal.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import { EventNames } from '../../../../../constants/events.js'
import { arbitrum } from 'viem/chains'
import { useMoonPayTransaction } from '../../../../../hooks/index.js'
import type {
  MoonPayBuyTransactionErrorResponse,
  MoonPayBuyTransactionsResponse
} from '../../../../../hooks/useMoonPayTransaction.js'

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
  moonPayThemeId?: string
  moonPayThemeMode?: 'dark' | 'light'
  moonPayApiKey?: string
  quoteRequestId?: string | null
  passthroughExternalId?: string
  onAnalyticEvent?: (eventName: string, data?: any) => void
  setStep: (step: OnrampStep) => void
  setProcessingStep: (processingStep?: OnrampProcessingStep) => void
  setMoonPayRequestId: (id: string) => void
  moonpayOnUrlSignatureRequested: (url: string) => Promise<string> | void
  onPassthroughSuccess: () => void
  onError: (error: Error) => void
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

arbitrum

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
  moonPayThemeId,
  moonPayThemeMode,
  quoteRequestId,
  moonPayApiKey,
  passthroughExternalId,
  onAnalyticEvent,
  setStep,
  setProcessingStep,
  setMoonPayRequestId,
  moonpayOnUrlSignatureRequested,
  onPassthroughSuccess,
  onError
}) => {
  const moonPayExternalId = !isPassthrough
    ? quoteRequestId ?? undefined
    : passthroughExternalId
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

  useMoonPayTransaction(
    moonPayExternalId,
    {
      apiKey: moonPayApiKey
    },
    {
      enabled:
        step !== OnrampStep.Confirming &&
        step !== OnrampStep.Error &&
        step !== OnrampStep.Success,
      refetchInterval: (query) => {
        let data = query.state.data
        if (data && 'moonPayErrorCode' in data) {
          const errorData = data as MoonPayBuyTransactionErrorResponse
          if (errorData.moonPayErrorCode != '1_SYS_UNKNOWN') {
            onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_API_ERROR, {
              data,
              isPassthrough
            })
          }
        } else if (data && 'status' in data) {
          const responseData = data as MoonPayBuyTransactionsResponse
          if (responseData?.status === 'failed') {
            onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_FAILED, {
              data,
              isPassthrough
            })
            onError(
              new Error(`MoonPayTxFailed: ${data.failureReason ?? 'unknown'}`)
            )
            return 0
          }

          if (responseData?.status === 'completed') {
            onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_COMPLETE, {
              data,
              isPassthrough
            })
            if (step === OnrampStep.Processing && !isPassthrough) {
              setProcessingStep(OnrampProcessingStep.Relaying)
            } else if (isPassthrough && step !== OnrampStep.Success) {
              setProcessingStep(undefined)
              onPassthroughSuccess()
            }
            return 0
          }

          if (responseData?.id && responseData?.status === 'pending') {
            if (step === OnrampStep.Moonpay) {
              if (!isPassthrough) {
                setStep(OnrampStep.Processing)
                setProcessingStep(OnrampProcessingStep.Finalizing)
                return 0
              } else {
                setStep(OnrampStep.ProcessingPassthrough)
              }
            }
          }
        }

        return 2000
      }
    }
  )

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
          <Box
            css={{ position: 'relative', width: 48, height: 52, flexShrink: 0 }}
          >
            <ChainTokenIcon
              chainId={toToken?.chainId}
              tokenlogoURI={toToken?.logoURI}
              css={{
                width: 32,
                height: 32,
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1
              }}
            />
            <ChainTokenIcon
              chainId={fromToken?.chainId}
              tokenlogoURI={fromToken?.logoURI}
              css={{
                width: 32,
                height: 32,
                position: 'absolute',
                bottom: 0,
                left: 0
              }}
            />
          </Box>
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
          themeId={moonPayThemeId}
          theme={moonPayThemeMode}
          externalTransactionId={moonPayExternalId}
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
              ...props,
              isPassthrough: (window as any).relayIsPassthrough
            })
            if (
              window &&
              (window as any).relayOnrampStep === OnrampStep.Moonpay
            ) {
              if (!(window as any).relayIsPassthrough) {
                setStep(OnrampStep.Processing)
                setProcessingStep(OnrampProcessingStep.Finalizing)
              } else {
                setStep(OnrampStep.ProcessingPassthrough)
              }
            }
          }}
          onTransactionCompleted={async (props) => {
            onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_COMPLETE, {
              ...props,
              isPassthrough: (window as any).relayIsPassthrough
            })
            if (
              window &&
              (window as any).relayOnrampStep === OnrampStep.Processing &&
              !(window as any).relayIsPassthrough
            ) {
              setProcessingStep(OnrampProcessingStep.Relaying)
            } else if (
              window &&
              (window as any).relayIsPassthrough &&
              (window as any).relayOnrampStep !== OnrampStep.Success
            ) {
              setProcessingStep(undefined)
              onPassthroughSuccess()
            }
          }}
        />
      </Suspense>
    </Flex>
  )
}
