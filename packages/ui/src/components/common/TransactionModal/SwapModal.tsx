import type { CallFees, Execute } from '@reservoir0x/relay-sdk'
import { type Address } from 'viem'
import { type FC, useEffect } from 'react'
import {
  type ChildrenProps,
  TransactionModalRenderer,
  TransactionProgressStep
} from './TransactionModalRenderer.js'
import { Modal } from '../Modal.js'
import { Flex, Text } from '../../primitives/index.js'
import { ErrorStep } from './steps/ErrorStep.js'
import { ValidatingStep } from './steps/ValidatingStep.js'
import { EventNames } from '../../../constants/events.js'
import { SwapConfirmationStep } from './steps/SwapConfirmationStep.js'
import { type Token } from '../../../types/index.js'
import { SwapSuccessStep } from './steps/SwapSuccessStep.js'
import { formatBN } from '../../../utils/numbers.js'
import { extractQuoteId } from '../../../utils/quote.js'

type SwapModalProps = {
  open: boolean
  fromToken?: Token
  toToken?: Token
  fees?: CallFees
  address?: Address
  steps?: Execute['steps'] | null
  details?: Execute['details'] | null
  error?: Error | null
  timeEstimate?: { time: number; formattedTime: string }
  isCanonical?: boolean
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: Execute) => void
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
    timeEstimate,
    isCanonical,
    onAnalyticEvent,
    onSuccess
  } = swapModalProps
  return (
    <TransactionModalRenderer
      steps={steps}
      error={error}
      address={address}
      onValidating={() => {
        onAnalyticEvent?.(EventNames.TRANSACTION_VALIDATING, {
          quote_id: steps ? extractQuoteId(steps) : undefined
        })
      }}
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
          quote_id: quoteId,
          txHashes: steps
            ?.map((step) => {
              let txHashes: { chainId: number; txHash: Address }[] = []
              step.items?.forEach((item) => {
                if (item.txHashes) {
                  txHashes = txHashes.concat([
                    ...(item.txHashes ?? []),
                    ...(item.internalTxHashes ?? [])
                  ])
                }
              })
              return txHashes
            })
            .flat()
        })
        onSuccess?.({
          steps: swapModalProps.steps as Execute['steps'],
          fees: swapModalProps.fees,
          details: swapModalProps.details as Execute['details']
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
            timeEstimate={timeEstimate}
            isCanonical={isCanonical}
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
  onAnalyticEvent,
  timeEstimate,
  isCanonical
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            timeEstimate={timeEstimate?.formattedTime}
            isCanonical={isCanonical}
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
