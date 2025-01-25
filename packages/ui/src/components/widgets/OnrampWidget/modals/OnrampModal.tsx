import type { Execute } from '@reservoir0x/relay-sdk'
import { type FC, lazy, Suspense, useEffect, useState } from 'react'
import { Modal } from '../../../common/Modal.js'
import { Button, Flex, Text } from '../../../primitives/index.js'
// import { MoonPayBuyWidget } from '@moonpay/moonpay-react'
import useMounted from '../../../../hooks/useMounted.js'

type OnrampModalProps = {
  open: boolean
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: Execute) => void
}

export const OnrampModal: FC<OnrampModalProps> = ({
  open,
  onAnalyticEvent,
  onSuccess,
  onOpenChange
}) => {
  const mounted = useMounted()
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
            height: '100%'
          }}
        >
          <Text style="h6" css={{ mb: 8 }}>
            Buy ETH
          </Text>
          <Button
            onClick={(e) => {
              // onAnalyticEvent
              setStep('MOONPAY')
            }}
          >
            Purchase $USDC
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
          {/* {mounted ? (
            <MoonPayBuyWidget
              variant="embedded"
              baseCurrencyCode="usd"
              baseCurrencyAmount={'20'}
              lockAmount="true"
              currencyCode="usdc"
              paymentMethod="credit_debit_card"
              walletAddress={'0x03508bB71268BBA25ECaCC8F620e01866650532c'}
              showWalletAddressForm="false"
              visible
              onTransactionCreated={async (props) => {
                //todo move to processing and start polling the transaction
              }}
            />
          ) : null} */}
        </Flex>
      ) : null}
    </Modal>
  )
}
