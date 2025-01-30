import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { type FC, lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Modal } from '../../../common/Modal.js'
import {
  Anchor,
  Box,
  Button,
  ChainTokenIcon,
  Flex,
  Pill,
  Text
} from '../../../primitives/index.js'
import type { Token } from '../../../../types/index.js'
import useRelayClient from '../../../../hooks/useRelayClient.js'
import { LoadingSpinner } from '../../../../components/common/LoadingSpinner.js'
import { EventNames } from '../../../../constants/events.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { useExecutionStatus } from '@reservoir0x/relay-kit-hooks'
import { extractDepositRequestId } from '../../../../utils/relayTransaction.js'

const MoonPayBuyWidget = lazy(() =>
  import('@moonpay/moonpay-react').then((module) => ({
    default: module.MoonPayBuyWidget
  }))
)

type OnrampModalProps = {
  open: boolean
  totalAmount?: string
  depositAddress?: string
  quote?: Execute
  fromToken?: Token
  fromChain?: RelayChain
  toToken?: Token
  toChain?: RelayChain
  moonpayOnUrlSignatureRequested: (url: string) => Promise<string> | void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: Execute) => void
}

export const OnrampModal: FC<OnrampModalProps> = ({
  open,
  totalAmount,
  depositAddress,
  fromToken,
  toToken,
  quote,
  toChain,
  fromChain,
  moonpayOnUrlSignatureRequested,
  onAnalyticEvent,
  onSuccess,
  onOpenChange
}) => {
  const [step, setStep] = useState<
    'CONFIRMING' | 'MOONPAY' | 'PROCESSING' | 'SUCCESS'
  >('CONFIRMING')
  const [processingStep, setProcessingStep] = useState<
    undefined | 'FINALIZING' | 'RELAYING'
  >()
  const [moonPayRequestId, setMoonPayRequestId] = useState<string | undefined>()
  const relayClient = useRelayClient()

  useEffect(() => {
    if (!open) {
      setStep('CONFIRMING')
      setProcessingStep(undefined)
    }
  }, [open])

  const baseTransactionUrl = relayClient?.baseApiUrl.includes('testnets')
    ? 'https://testnets.relay.link'
    : 'https://relay.link'

  const requestId = useMemo(
    () => extractDepositRequestId(quote?.steps as Execute['steps']),
    [quote]
  )

  const { data: executionStatus } = useExecutionStatus(
    relayClient ? relayClient : undefined,
    {
      requestId: requestId ?? undefined
    },
    undefined,
    undefined,
    {
      enabled: requestId !== null && step === 'PROCESSING' && open,
      refetchInterval(query) {
        const observableStates = ['waiting', 'pending', 'delayed']

        if (
          !query.state.data?.status ||
          (requestId && observableStates.includes(query.state.data?.status))
        ) {
          return 1000
        }
        return 0
      }
    }
  )

  useEffect(() => {
    if (
      executionStatus?.status === 'pending' &&
      (step !== 'PROCESSING' || processingStep !== 'RELAYING')
    ) {
      setStep('PROCESSING')
      setProcessingStep('RELAYING')
    }
    if (executionStatus?.status === 'success') {
      setStep('SUCCESS')
      setProcessingStep(undefined)
    }
  }, [executionStatus])

  return (
    <Modal
      trigger={null}
      open={open}
      onOpenChange={(open) => {
        if (open) {
          onAnalyticEvent?.(EventNames.ONRAMP_MODAL_OPEN)
        } else {
          onAnalyticEvent?.(EventNames.ONRAMP_MODAL_CLOSE)
        }
        onOpenChange(open)
      }}
      css={{
        overflow: 'hidden',
        p: '4',
        maxWidth: '412px !important'
      }}
    >
      {step === 'CONFIRMING' ? (
        <Flex
          direction="column"
          css={{
            width: '100%',
            height: '100%',
            gap: '4'
          }}
        >
          <Text style="h6">Buy {toToken?.name}</Text>
          <Flex
            direction="column"
            css={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: 'widget-card-border-radius',
              '--borderColor': 'colors.subtle-border-color',
              border: '1px solid var(--borderColor)',
              p: '4'
            }}
          >
            <Flex align="center" css={{ gap: '2' }}>
              <ChainTokenIcon
                chainId={fromToken?.chainId}
                tokenlogoURI={fromToken?.logoURI}
                css={{ width: 32, height: 32 }}
              />
              <Text style="subtitle1">
                You’ll purchase {fromToken?.symbol} via your card
              </Text>
            </Flex>
            <Box
              css={{
                height: 24,
                width: 1,
                background: 'gray5',
                my: '5px',
                ml: 4
              }}
            />
            <Flex align="center" css={{ gap: '2' }}>
              <ChainTokenIcon
                chainId={toToken?.chainId}
                tokenlogoURI={toToken?.logoURI}
                css={{ width: 32, height: 32 }}
              />
              <Text style="subtitle1">Relay converts to {toToken?.symbol}</Text>
            </Flex>
          </Flex>
          <Text style="subtitle2">
            This transaction occurs in two steps. MoonPay powers only your
            purchase of {fromToken?.symbol} ({fromChain?.displayName}) which
            Relay then converts to {toToken?.symbol} ({toChain?.displayName}).
          </Text>
          <Button
            css={{ justifyContent: 'center' }}
            onClick={(e) => {
              // onAnalyticEvent
              setStep('MOONPAY')
            }}
          >
            Purchase {fromToken?.symbol}
          </Button>
        </Flex>
      ) : null}
      <Flex
        direction="column"
        css={{
          width: '100%',
          height: '100%',
          display: step === 'MOONPAY' ? 'flex' : 'none'
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
        <Suspense fallback={<div>Loading...</div>}>
          {MoonPayBuyWidget ? (
            <MoonPayBuyWidget
              variant="embedded"
              baseCurrencyCode="usd"
              quoteCurrencyAmount={totalAmount}
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
                if (step === 'MOONPAY') {
                  setStep('PROCESSING')
                  setProcessingStep('FINALIZING')
                  onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_START, {
                    ...props
                  })
                }
              }}
              onTransactionCompleted={async (props) => {
                if (step === 'PROCESSING') {
                  setProcessingStep('RELAYING')
                  onAnalyticEvent?.(EventNames.ONRAMPING_MOONPAY_TX_COMPLETE, {
                    ...props
                  })
                }
              }}
            />
          ) : null}
        </Suspense>
      </Flex>
      {step === 'PROCESSING' ? (
        <Flex
          direction="column"
          css={{
            width: '100%',
            height: '100%'
          }}
        >
          <Text style="h6" css={{ mb: '4' }}>
            Processing Transaction
          </Text>
          <Flex
            direction="column"
            css={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: 'widget-card-border-radius',
              '--borderColor': 'colors.subtle-border-color',
              border: '1px solid var(--borderColor)',
              p: '4',
              mb: '4'
            }}
          >
            <Flex align="center" css={{ gap: '2' }}>
              <ChainTokenIcon
                chainId={fromToken?.chainId}
                tokenlogoURI={fromToken?.logoURI}
                css={{
                  width: 32,
                  height: 32,
                  filter:
                    processingStep === 'RELAYING' ? 'grayscale(1)' : 'none'
                }}
              />
              <Flex css={{ gap: '1' }} direction="column">
                <Text
                  style="subtitle1"
                  color={processingStep === 'RELAYING' ? 'subtle' : undefined}
                >
                  {processingStep === 'RELAYING'
                    ? `Purchased ${fromToken?.symbol}(${fromChain?.displayName}) via your card`
                    : `Finalizing your purchase of ${fromToken?.symbol}(${fromChain?.displayName}) via your card`}
                </Text>
                {moonPayRequestId ? (
                  <Anchor
                    href={`https://buy.moonpay.com/transaction_receipt?transactionId=${moonPayRequestId}`}
                    target="_blank"
                    css={{ display: 'flex', alignItems: 'center', gap: '1' }}
                  >
                    Track MoonPay transaction{' '}
                    <FontAwesomeIcon
                      icon={faUpRightFromSquare}
                      style={{ width: 14 }}
                    />
                  </Anchor>
                ) : null}
              </Flex>
              {processingStep === 'RELAYING' ? (
                <Box css={{ color: 'green9', ml: 'auto' }}>
                  <FontAwesomeIcon icon={faCheck} style={{ height: 16 }} />
                </Box>
              ) : (
                <LoadingSpinner
                  css={{ height: 20, width: 20, fill: 'gray9', ml: 'auto' }}
                />
              )}
            </Flex>
            {processingStep === 'FINALIZING' ? (
              <Pill
                radius="rounded"
                color="gray"
                css={{ width: '100%', py: '2', px: '3', mt: '6px' }}
              >
                <Text style="subtitle2" color="subtle">
                  It might take a few minutes for the MoonPay transaction to
                  finalize.
                </Text>
              </Pill>
            ) : null}
            <Box
              css={{
                height: 24,
                width: 1,
                background: 'gray5',
                my: '5px',
                ml: 4
              }}
            />
            <Flex
              align="center"
              css={{
                gap: '2'
              }}
            >
              <ChainTokenIcon
                chainId={toToken?.chainId}
                tokenlogoURI={toToken?.logoURI}
                css={{
                  width: 32,
                  height: 32,
                  filter:
                    processingStep === 'RELAYING' ? 'none' : 'grayscale(1)'
                }}
              />
              <Flex css={{ gap: '1' }} direction="column">
                <Text
                  style="subtitle1"
                  color={processingStep === 'RELAYING' ? undefined : 'subtle'}
                >
                  {processingStep === 'RELAYING'
                    ? `Converting to ${toToken?.symbol}(${toChain?.displayName})`
                    : `Relay converts to ${toToken?.symbol}(${toChain?.displayName})`}
                </Text>
                {/* {txHash ? (
                  <Anchor
                    href={`${baseTransactionUrl}`}
                    target="_blank"
                    css={{ display: 'flex', alignItems: 'center', gap: '1' }}
                  >
                    Track MoonPay transaction{' '}
                    <FontAwesomeIcon
                      icon={faUpRightFromSquare}
                      style={{ width: 14 }}
                    />
                  </Anchor>
                ) : null} */}
              </Flex>
              {processingStep === 'RELAYING' ? (
                <LoadingSpinner
                  css={{ height: 16, width: 16, fill: 'gray9', ml: 'auto' }}
                />
              ) : null}
            </Flex>
          </Flex>
          <Text style="body2" color="subtle">
            Feel free to leave at any time, you can track your progress within
            the
            <Anchor
              href={`${baseTransactionUrl}/transaction/`}
              target="_blank"
              css={{ ml: '1' }}
            >
              transaction page
            </Anchor>
            .
          </Text>
        </Flex>
      ) : null}
    </Modal>
  )
}
