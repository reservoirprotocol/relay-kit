import type { AdaptedWallet, Execute, RelayChain } from '@reservoir0x/relay-sdk'
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
import type { LinkedWallet } from '../../../types/index.js'
import { ApprovalPlusSwapStep } from './steps/ApprovalPlusSwapStep.js'
import { useAtomicBatchSupport } from '../../../hooks/index.js'

type SwapModalProps = {
  open: boolean
  fromChain?: RelayChain
  fromToken?: Token
  toToken?: Token
  address?: Address | string
  timeEstimate?: { time: number; formattedTime: string }
  isCanonical?: boolean
  debouncedOutputAmountValue: string
  debouncedInputAmountValue: string
  amountInputValue: string
  amountOutputValue: string
  recipient?: Address | string
  customToAddress?: Address | string
  tradeType: TradeType
  useExternalLiquidity: boolean
  slippageTolerance?: string
  wallet?: AdaptedWallet
  linkedWallets?: LinkedWallet[]
  multiWalletSupportEnabled?: boolean
  invalidateBalanceQueries: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: Execute) => void
  onSwapValidating?: (data: Execute) => void
}

export const SwapModal: FC<SwapModalProps> = (swapModalProps) => {
  const {
    open,
    address,
    fromChain,
    fromToken,
    toToken,
    tradeType,
    recipient,
    debouncedInputAmountValue,
    debouncedOutputAmountValue,
    amountInputValue,
    amountOutputValue,
    useExternalLiquidity,
    slippageTolerance,
    timeEstimate,
    isCanonical,
    wallet,
    invalidateBalanceQueries,
    onAnalyticEvent,
    onSuccess,
    onSwapValidating
  } = swapModalProps
  return (
    <TransactionModalRenderer
      open={open}
      fromChain={fromChain}
      fromToken={fromToken}
      toToken={toToken}
      amountInputValue={amountInputValue}
      amountOutputValue={amountOutputValue}
      debouncedInputAmountValue={debouncedInputAmountValue}
      debouncedOutputAmountValue={debouncedOutputAmountValue}
      tradeType={tradeType}
      useExternalLiquidity={useExternalLiquidity}
      slippageTolerance={slippageTolerance}
      address={address}
      recipient={recipient}
      wallet={wallet}
      invalidateBalanceQueries={invalidateBalanceQueries}
      onAnalyticEvent={onAnalyticEvent}
      onValidating={(quote) => {
        const steps = quote?.steps
        const details = quote?.details
        const fees = quote?.fees
        onAnalyticEvent?.(EventNames.TRANSACTION_VALIDATING, {
          quote_id: steps ? extractQuoteId(steps) : undefined
        })
        onSwapValidating?.({
          steps: steps,
          fees: fees,
          details: details
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
          is_canonical: useExternalLiquidity,
          quote_id: quoteId,
          txHashes: steps
            ?.map((step) => {
              let txHashes: { chainId: number; txHash: string }[] = []
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
  wallet,
  fromToken,
  toToken,
  quote,
  isFetchingQuote,
  isRefetchingQuote,
  quoteError,
  address,
  requestId,
  swap,
  swapError,
  setSwapError,
  progressStep,
  setProgressStep,
  steps,
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
  quoteUpdatedAt,
  linkedWallets,
  multiWalletSupportEnabled,
  useExternalLiquidity,
  fromChain,
  waitingForSteps,
  isLoadingTransaction
}) => {
  const { isSupported: isAtomicBatchSupported } = useAtomicBatchSupport(
    wallet,
    fromToken?.chainId
  )
  const firstStep = quote?.steps?.[0]
  const secondStep = quote?.steps?.[1]
  const isApprovalPlusSwap =
    firstStep?.id === 'approve' &&
    firstStep?.items?.[0]?.status === 'incomplete' &&
    (secondStep?.id === 'deposit' || secondStep?.id === 'swap') &&
    !isAtomicBatchSupported

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
        p: '4',
        maxWidth: '412px !important'
      }}
      showCloseButton={isReviewQuoteStep}
      onPointerDownOutside={(e) => {
        const dynamicModalElements = Array.from(
          document.querySelectorAll('#dynamic-send-transaction')
        )
        const clickedInsideDynamicModal = dynamicModalElements.some((el) =>
          e.target ? el.contains(e.target as Node) : false
        )

        if (clickedInsideDynamicModal && dynamicModalElements.length > 0) {
          e.preventDefault()
        }
      }}
    >
      <Flex
        direction="column"
        css={{
          width: '100%',
          height: '100%',
          gap: isReviewQuoteStep ? '3' : '4'
        }}
      >
        <Text style="h6" css={{ mb: 8 }}>
          {isReviewQuoteStep ? 'Review Quote' : 'Transaction Details'}
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
            address={address}
            linkedWallets={linkedWallets}
            multiWalletSupportEnabled={multiWalletSupportEnabled}
            useExternalLiquidity={useExternalLiquidity}
            waitingForSteps={waitingForSteps}
          />
        ) : null}

        {(progressStep === TransactionProgressStep.WalletConfirmation ||
          progressStep === TransactionProgressStep.Validating) &&
        isApprovalPlusSwap ? (
          <ApprovalPlusSwapStep
            fromToken={fromToken}
            toToken={toToken}
            fromAmountFormatted={fromAmountFormatted}
            toAmountFormatted={toAmountFormatted}
            steps={steps}
            quote={quote}
          />
        ) : null}

        {progressStep === TransactionProgressStep.WalletConfirmation &&
        !isApprovalPlusSwap ? (
          <SwapConfirmationStep
            fromToken={fromToken}
            toToken={toToken}
            fromAmountFormatted={fromAmountFormatted}
            toAmountFormatted={toAmountFormatted}
            quote={quote}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Validating &&
        !isApprovalPlusSwap ? (
          <ValidatingStep
            currentStep={currentStep}
            currentStepItem={currentStepItem}
            requestId={requestId}
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
            isLoadingTransaction={isLoadingTransaction}
          />
        ) : null}
        {progressStep === TransactionProgressStep.Error ? (
          <ErrorStep
            error={swapError || quoteError}
            allTxHashes={allTxHashes}
            address={address}
            onOpenChange={onOpenChange}
            transaction={transaction}
            fromChain={fromChain}
          />
        ) : null}
      </Flex>
    </Modal>
  )
}
