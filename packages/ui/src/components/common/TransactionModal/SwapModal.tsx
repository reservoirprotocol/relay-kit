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
import { ReviewQuoteStep } from './steps/ReviewQuoteStep.js'
import { type Token } from '../../../types/index.js'
import { SwapSuccessStep } from './steps/SwapSuccessStep.js'
import { formatBN } from '../../../utils/numbers.js'
import type { TradeType } from '../../../components/widgets/SwapWidgetRenderer.js'
import { extractQuoteId } from '../../../utils/quote.js'

type SwapModalProps = {
  open: boolean
  fromToken?: Token
  toToken?: Token
  address?: Address
  timeEstimate?: { time: number; formattedTime: string }
  isCanonical?: boolean
  debouncedOutputAmountValue: string
  debouncedInputAmountValue: string
  amountInputValue: string
  amountOutputValue: string
  toDisplayName?: string
  recipient?: Address
  customToAddress?: Address
  tradeType: TradeType
  useExternalLiquidity: boolean
  invalidateBalanceQueries: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: Execute) => void
}

export const SwapModal: FC<SwapModalProps> = (swapModalProps) => {
  const {
    open,
    address,
    fromToken,
    toToken,
    tradeType,
    recipient,
    debouncedInputAmountValue,
    debouncedOutputAmountValue,
    amountInputValue,
    amountOutputValue,
    useExternalLiquidity,
    timeEstimate,
    isCanonical,
    invalidateBalanceQueries,
    onAnalyticEvent,
    onSuccess
  } = swapModalProps
  return (
    <TransactionModalRenderer
      open={open}
      fromToken={fromToken}
      toToken={toToken}
      amountInputValue={amountInputValue}
      amountOutputValue={amountOutputValue}
      debouncedInputAmountValue={debouncedInputAmountValue}
      debouncedOutputAmountValue={debouncedOutputAmountValue}
      tradeType={tradeType}
      useExternalLiquidity={useExternalLiquidity}
      address={address}
      recipient={recipient}
      invalidateBalanceQueries={invalidateBalanceQueries}
      onValidating={(quote) => {
        const steps = quote?.steps
        onAnalyticEvent?.(EventNames.TRANSACTION_VALIDATING, {
          quote_id: steps ? extractQuoteId(steps) : undefined
        })
      }}
      onSuccess={(quote, steps) => {
        const details = quote?.details
        const fees = quote?.fees

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
          steps: steps,
          fees: fees,
          details: details
        })
      }}
    >
      {(rendererProps) => {
        return (
          <InnerSwapModal
            address={address}
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
  quote,
  isFetchingQuote,
  isRefetchingQuote,
  quoteError,
  swap,
  swapError,
  setSwapError,
  address,
  progressStep,
  setProgressStep,
  setSteps,
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
  isCanonical,
  feeBreakdown,
  quoteUpdatedAt
}) => {
  useEffect(() => {
    if (!open) {
      if (currentStep) {
        onAnalyticEvent?.(EventNames.SWAP_MODAL_CLOSED)
      }
      setCurrentStep(null)
      setCurrentStepItem(null)
      setAllTxHashes([])
      setStartTimestamp(0)
      setSwapError(null)
    } else {
      setSteps(null)
      setProgressStep(TransactionProgressStep.ReviewQuote)
      onAnalyticEvent?.(EventNames.SWAP_MODAL_OPEN)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const details = quote?.details

  const fromAmountFormatted = details?.currencyIn?.amount
    ? formatBN(details?.currencyIn?.amount, 6, fromToken?.decimals, false)
    : ''
  const toAmountFormatted = details?.currencyOut?.amount
    ? formatBN(details?.currencyOut.amount, 6, toToken?.decimals, false)
    : ''

  const isReviewQuoteStep = progressStep === TransactionProgressStep.ReviewQuote

  return (
    <Modal
      trigger={null}
      open={open}
      onOpenChange={onOpenChange}
      css={{
        overflow: 'hidden',
        p: isReviewQuoteStep ? '4' : '5',
        maxWidth: '400px !important'
      }}
      showCloseButton={isReviewQuoteStep}
    >
      <Flex
        direction="column"
        css={{
          width: '100%',
          height: '100%',
          gap: isReviewQuoteStep ? '3' : '4'
        }}
      >
        <Text style="h5" css={{ mb: 8 }}>
          {isReviewQuoteStep ? 'Review Quote' : 'Swap Details'}
        </Text>

        {progressStep === TransactionProgressStep.ReviewQuote ? (
          <ReviewQuoteStep
            fromToken={fromToken}
            toToken={toToken}
            fromAmountFormatted={fromAmountFormatted}
            toAmountFormatted={toAmountFormatted}
            feeBreakdown={feeBreakdown}
            isFetchingQuote={isFetchingQuote}
            isRefetchingQuote={isRefetchingQuote}
            quoteUpdatedAt={quoteUpdatedAt}
            quote={quote}
            swap={swap}
          />
        ) : null}

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
            details={details}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Error ? (
          <ErrorStep
            error={swapError || quoteError}
            allTxHashes={allTxHashes}
            address={address}
            onOpenChange={onOpenChange}
            transaction={transaction}
          />
        ) : null}
      </Flex>
    </Modal>
  )
}
