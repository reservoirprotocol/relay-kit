import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import {
  type FC,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useState
} from 'react'
import { Modal } from '../../../common/Modal.js'
import {
  Box,
  Button,
  ChainTokenIcon,
  Flex,
  Text
} from '../../../primitives/index.js'
import type { Token } from '../../../../types/index.js'

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

  useEffect(() => {
    if (!open) {
      // if (currentStep) {
      //   onAnalyticEvent?.(EventNames.SWAP_MODAL_CLOSED)
      // }
    } else {
      // onAnalyticEvent?.(EventNames.SWAP_MODAL_OPEN)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const amountOut = quote?.details?.currencyOut?.amountFormatted

  return (
    <Modal
      trigger={null}
      open={open}
      onOpenChange={onOpenChange}
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
          <Text style="h6" css={{ mb: 8 }}>
            Buy ETH
          </Text>
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
                You’ll purchase {totalAmount} {fromToken?.symbol} via your card
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
              <Text style="subtitle1">
                Relay converts to {amountOut} {toToken?.symbol}
              </Text>
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
      {step === 'MOONPAY' ? (
        <Flex
          direction="column"
          css={{
            width: '100%',
            height: '100%'
          }}
        >
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
            <Text style="subtitle1">
              Purchase {fromToken?.symbol} via your card for Relay to convert to{' '}
              {toToken?.symbol}
            </Text>
          </Flex>
          <Suspense fallback={<div>Loading...</div>}>
            {MoonPayBuyWidget ? (
              <MoonPayBuyWidget
                variant="embedded"
                baseCurrencyCode="usd"
                baseCurrencyAmount={totalAmount}
                lockAmount="true"
                currencyCode="usdc"
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
                // onTransactionCreated={async (props) => {
                //todo move to processing and start polling the transaction
                // }}
              />
            ) : null}
          </Suspense>
        </Flex>
      ) : null}
    </Modal>
  )
}
