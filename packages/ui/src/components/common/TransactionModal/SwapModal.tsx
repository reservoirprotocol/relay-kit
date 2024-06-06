import type { CallFees, Execute } from '@reservoir0x/relay-sdk'
import { type Address } from 'viem'
import { type FC, useEffect } from 'react'
import {
  type ChildrenProps,
  TransactionModalRenderer,
  TransactionProgressStep
} from './TransactionModalRenderer'
import { Modal } from '../Modal'
import { Flex, Text } from '../../primitives'
import { ErrorStep } from './steps/ErrorStep'
import { ValidatingStep } from './steps/ValidatingStep'
import { EventNames } from '../../../constants/events'
import { SwapConfirmationStep } from './steps/SwapConfirmationStep'
import { type Token } from '../../../types'
import { SwapSuccessStep } from './steps/SwapSuccessStep'
import { formatBN } from '../../../utils/numbers'
import { extractQuoteId } from '../../../utils/quote'

type SwapModalProps = {
  open: boolean
  fromToken?: Token
  toToken?: Token
  fees?: CallFees
  address?: Address
  steps?: Execute['steps'] | null
  details?: Execute['details'] | null
  error?: Error | null
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
}

export const SwapModal: FC<SwapModalProps> = (swapModalProps) => {
  const {
    steps,
    fees,
    error,
    address,
    details,
    fromToken,
    toToken,
    onAnalyticEvent
  } = swapModalProps
  return (
    <TransactionModalRenderer
      steps={steps}
      error={error}
      address={address}
      onSuccess={() => {
        const extraData: {
          gas_fee?: number
          relayer_fee?: number
          amount_in: number
          amount_out: number
        } = {
          amount_in: parseFloat(`${details?.currencyIn?.amountFormatted}`),
          amount_out: parseFloat(`${details?.currencyOut?.amountFormatted}`)
        }
        if (fees?.gas?.amountFormatted) {
          extraData.gas_fee = parseFloat(fees.gas.amountFormatted)
        }
        if (fees?.relayer?.amountFormatted) {
          extraData.relayer_fee = parseFloat(fees.relayer.amountFormatted)
        }
        const quoteId = steps ? extractQuoteId(steps) : undefined
        onAnalyticEvent?.(EventNames.SWAP_SUCCESS, {
          ...extraData,
          chain_id_in: fromToken?.chainId,
          currency_in: fromToken?.symbol,
          chain_id_out: toToken?.chainId,
          currency_out: toToken?.symbol,
          quote_id: quoteId
        })
      }}
    >
      {(rendererProps) => {
        return (
          <InnerSwapModal
            steps={steps}
            fees={fees}
            error={error}
            address={address}
            details={details}
            onAnalyticEvent={onAnalyticEvent}
            {...swapModalProps}
            {...rendererProps}
          />
        )
      }}
    </TransactionModalRenderer>
  )
}

type InnerSwapModalProps = ChildrenProps & SwapModalProps

const InnerSwapModal: FC<InnerSwapModalProps> = ({
  open,
  onOpenChange,
  fromToken,
  toToken,
  details,
  address,
  error,
  progressStep,
  setProgressStep,
  currentStep,
  setCurrentStep,
  currentStepItem,
  setCurrentStepItem,
  allTxHashes,
  setAllTxHashes,
  transaction,
  executionTime,
  executionTimeSeconds,
  setStartTimestamp,
  onAnalyticEvent
}) => {
  useEffect(() => {
    if (!open) {
      if (currentStep) {
        onAnalyticEvent?.(EventNames.SWAP_MODAL_CLOSED)
      }
      setProgressStep(TransactionProgressStep.WalletConfirmation)
      setCurrentStep(null)
      setCurrentStepItem(null)
      setAllTxHashes([])
      setStartTimestamp(0)
    } else {
      onAnalyticEvent?.(EventNames.SWAP_MODAL_OPEN)
    }
  }, [open])

  const fromAmountFormatted = details?.currencyIn?.amount
    ? formatBN(details?.currencyIn?.amount, 6, fromToken?.decimals)
    : ''
  const toAmountFormatted = details?.currencyOut?.amount
    ? formatBN(details?.currencyOut.amount, 6, toToken?.decimals)
    : ''

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
          bp600Down: {
            width: 370
          }
        }}
      >
        <Text style="h5" css={{ mb: 8 }}>
          Swap Details
        </Text>

        {progressStep === TransactionProgressStep.WalletConfirmation ? (
          <SwapConfirmationStep
            fromToken={fromToken}
            toToken={toToken}
            fromAmountFormatted={fromAmountFormatted}
            toAmountFormatted={toAmountFormatted}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Validating ? (
          <ValidatingStep
            currentStep={currentStep}
            currentStepItem={currentStepItem}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Success ? (
          <SwapSuccessStep
            fromToken={fromToken}
            toToken={toToken}
            fromAmountFormatted={fromAmountFormatted}
            toAmountFormatted={toAmountFormatted}
            allTxHashes={allTxHashes}
            transaction={transaction}
            fillTime={executionTime ?? ''}
            seconds={executionTimeSeconds ?? 0}
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
