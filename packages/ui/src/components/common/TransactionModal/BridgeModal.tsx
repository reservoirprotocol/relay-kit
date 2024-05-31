import { CallFees, Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { Currency } from '../../../lib/constants/currencies'
import { Address, parseUnits } from 'viem'
import { calculateTotalAmount, extractQuoteId } from '../../../lib/utils/quote'
import { BridgeType } from '../../bridge/BridgeTypeSelector'
import { FC, useEffect, useMemo } from 'react'
import {
  ChildrenProps,
  TransactionModalRenderer,
  TransactionProgressStep
} from './TransactionModalRenderer'
import { Modal } from '../Modal'
import { Flex, Text } from '../../primitives'
import { ErrorStep } from './steps/ErrorStep'
import { ValidatingStep } from './steps/ValidatingStep'
import { BridgeSuccessStep } from './steps/BridgeSuccessStep'
import { formatBN } from '../../../lib/utils/numbers'
import { BridgeConfirmationStep } from './steps/BridgeConfirmationStep'
import posthog from 'posthog-js'
import { EventNames } from '../../../analytics/events'

type BridgeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  toChain: RelayChain
  fromChain: RelayChain
  currency: Currency
  fees?: Execute['fees']
  address?: Address
  bridgeAmount?: string
  totalAmount?: ReturnType<typeof calculateTotalAmount>
  steps?: Execute['steps'] | null
  error?: Error | null
  bridgeType?: BridgeType
  timeEstimate?: string
}

export const BridgeModal: FC<BridgeModalProps> = (bridgeModalProps) => {
  const {
    steps,
    fees,
    error,
    address,
    bridgeAmount,
    fromChain,
    toChain,
    currency,
    bridgeType
  } = bridgeModalProps
  return (
    <TransactionModalRenderer
      steps={steps}
      fees={fees}
      error={error}
      address={address}
      onSuccess={() => {
        const formattedAmount = formatBN(
          parseUnits(
            bridgeAmount && bridgeAmount != '' ? bridgeAmount : '0',
            currency.decimals
          ),
          5,
          currency.decimals
        )
        const extraData: {
          gas_fee?: number
          relayer_fee?: number
          amount: number
        } = {
          amount: parseFloat(`${formattedAmount}`)
        }
        if (fees?.gas?.amountFormatted) {
          extraData.gas_fee = parseFloat(fees.gas.amountFormatted)
        }
        if (fees?.relayer?.amountFormatted) {
          extraData.relayer_fee = parseFloat(fees.relayer.amountFormatted)
        }

        posthog.capture(EventNames.BRIDGE_SUCCESS, {
          ...extraData,
          fromChainId: fromChain.id,
          toChainId: toChain.id,
          currency: currency.symbol,
          bridgeType,
          quote_id: steps ? extractQuoteId(steps) : undefined
        })
      }}
    >
      {(rendererProps) => {
        return (
          <InnerBridgeModal
            steps={steps}
            fees={fees}
            error={error}
            address={address}
            {...bridgeModalProps}
            {...rendererProps}
          />
        )
      }}
    </TransactionModalRenderer>
  )
}

type InnerBridgeProps = ChildrenProps & BridgeModalProps

const InnerBridgeModal: FC<InnerBridgeProps> = ({
  open,
  onOpenChange,
  toChain,
  fromChain,
  currency,
  fees,
  address,
  bridgeAmount,
  totalAmount,
  steps,
  error,
  bridgeType,
  timeEstimate,
  progressStep,
  setProgressStep,
  currentStep,
  setCurrentStep,
  currentStepItem,
  setCurrentStepItem,
  allTxHashes,
  setAllTxHashes,
  transaction,
  fillTime,
  seconds,
  setStartTimestamp,
  requestId
}) => {
  const amount = useMemo(() => {
    const raw = parseUnits(
      bridgeAmount && bridgeAmount != '' ? bridgeAmount : '0',
      currency.decimals
    )
    const formatted = formatBN(raw, 5, currency.decimals)
    return {
      raw,
      formatted
    }
  }, [bridgeAmount, currency])

  useEffect(() => {
    if (!open) {
      if (currentStep) {
        posthog.capture(EventNames.BRIDGE_MODAL_CLOSED)
      }
      setProgressStep(TransactionProgressStep.WalletConfirmation)
      setCurrentStep(null)
      setCurrentStepItem(null)
      setAllTxHashes([])
      setStartTimestamp(0)
    } else {
      posthog.capture(EventNames.BRIDGING_MODAL_OPEN)
    }
  }, [open])

  return (
    <Modal
      trigger={null}
      open={open}
      onOpenChange={onOpenChange}
      contentCss={{
        overflow: 'hidden'
      }}
    >
      <Flex
        direction="column"
        css={{
          width: '100%',
          height: '100%',
          gap: '4',
          sm: {
            width: 370
          }
        }}
      >
        <Text style="h5" css={{ mb: 8 }}>
          Bridging Details
        </Text>

        {progressStep === TransactionProgressStep.WalletConfirmation ? (
          <BridgeConfirmationStep
            fromChain={fromChain}
            toChain={toChain}
            currency={currency}
            totalAmount={totalAmount}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Validating ? (
          <ValidatingStep
            currentStep={currentStep}
            currentStepItem={currentStepItem}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Success ? (
          <BridgeSuccessStep
            bridgeType={bridgeType}
            toChain={toChain}
            fromChain={fromChain}
            currency={currency}
            amount={amount}
            requestId={requestId}
            timeEstimate={timeEstimate}
            allTxHashes={allTxHashes}
            transaction={transaction}
            fillTime={fillTime}
            seconds={seconds}
            onOpenChange={onOpenChange}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Error ? (
          <ErrorStep
            error={error}
            allTxHashes={allTxHashes}
            address={address}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </Flex>
    </Modal>
  )
}
