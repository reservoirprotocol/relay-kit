import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { type Address } from 'viem'
import { type FC, useEffect } from 'react'
import {
  type ChildrenProps,
  DepositAddressModalRenderer,
  TransactionProgressStep
} from './DepositAddressModalRenderer.js'
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

type DepositAddressModalProps = {
  open: boolean
  fromChain?: RelayChain
  fromToken?: Token
  toToken?: Token
  address?: Address | string
  timeEstimate?: { time: number; formattedTime: string }
  debouncedOutputAmountValue: string
  debouncedInputAmountValue: string
  amountInputValue: string
  amountOutputValue: string
  recipient?: Address | string
  customToAddress?: Address | string
  refundAddress?: Address | string
  invalidateBalanceQueries: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: Execute) => void
}

export const DepositAddressModal: FC<DepositAddressModalProps> = (
  depositAddressModalProps
) => {
  const {
    open,
    address,
    fromChain,
    fromToken,
    toToken,
    recipient,
    debouncedInputAmountValue,
    debouncedOutputAmountValue,
    amountInputValue,
    amountOutputValue,
    timeEstimate,
    invalidateBalanceQueries,
    onAnalyticEvent,
    onSuccess
  } = depositAddressModalProps
  return (
    <DepositAddressModalRenderer
      open={open}
      fromChain={fromChain}
      fromToken={fromToken}
      toToken={toToken}
      amountInputValue={amountInputValue}
      amountOutputValue={amountOutputValue}
      debouncedInputAmountValue={debouncedInputAmountValue}
      debouncedOutputAmountValue={debouncedOutputAmountValue}
      address={address}
      recipient={recipient}
      invalidateBalanceQueries={invalidateBalanceQueries}
      onAnalyticEvent={onAnalyticEvent}
      onValidating={(quote) => {
        const steps = quote?.steps
        onAnalyticEvent?.(EventNames.TRANSACTION_VALIDATING, {
          quote_id: steps ? extractQuoteId(steps) : undefined
        })
      }}
      onSuccess={(quote) => {
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
        const quoteId = quote
          ? extractQuoteId(quote?.steps as Execute['steps'])
          : undefined
        onAnalyticEvent?.(EventNames.SWAP_SUCCESS, {
          ...extraData,
          chain_id_in: fromToken?.chainId,
          currency_in: fromToken?.symbol,
          chain_id_out: toToken?.chainId,
          currency_out: toToken?.symbol,
          quote_id: quoteId
          //TODO
          // txHashes: steps
          //   ?.map((step) => {
          //     let txHashes: { chainId: number; txHash: string }[] = []
          //     step.items?.forEach((item) => {
          //       if (item.txHashes) {
          //         txHashes = txHashes.concat([
          //           ...(item.txHashes ?? []),
          //           ...(item.internalTxHashes ?? [])
          //         ])
          //       }
          //     })
          //     return txHashes
          //   })
          //   .flat()
        })
        onSuccess?.({
          steps: quote?.steps as Execute['steps'],
          fees: fees,
          details: details
        })
      }}
    >
      {(rendererProps) => {
        return (
          <InnerDepositAddressModal
            address={address}
            onAnalyticEvent={onAnalyticEvent}
            timeEstimate={timeEstimate}
            {...depositAddressModalProps}
            {...rendererProps}
          />
        )
      }}
    </DepositAddressModalRenderer>
  )
}

type InnerDepositAddressModalProps = ChildrenProps & DepositAddressModalProps

const InnerDepositAddressModal: FC<InnerDepositAddressModalProps> = ({
  open,
  onOpenChange,
  fromToken,
  toToken,
  quote,
  isFetchingQuote,
  isRefetchingQuote,
  quoteError,
  address,
  swapError,
  setSwapError,
  progressStep,
  setProgressStep,
  allTxHashes,
  setAllTxHashes,
  transaction,
  onAnalyticEvent,
  timeEstimate,
  fillTime,
  seconds,
  fromChain
}) => {
  useEffect(() => {
    if (!open) {
      if (quote) {
        onAnalyticEvent?.(EventNames.DEPOSIT_ADDRESS_MODAL_CLOSED)
      }
      setAllTxHashes([])
      setSwapError(null)
    } else {
      setProgressStep(TransactionProgressStep.WaitingForDeposit)
      onAnalyticEvent?.(EventNames.DEPOSIT_ADDRESS_MODAL_OPEN)
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

  const isWaitingForDeposit =
    progressStep === TransactionProgressStep.WaitingForDeposit

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
      showCloseButton={true}
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
          gap: isWaitingForDeposit ? '3' : '4'
        }}
      >
        <Text style="h6" css={{ mb: 8 }}>
          {isWaitingForDeposit ? 'Send Funds' : 'Trade Details'}
        </Text>

        {/* {progressStep === TransactionProgressStep.ReviewQuote ? (
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
        ) : null} */}
        {progressStep === TransactionProgressStep.WaitingForDeposit ? (
          <div></div>
        ) : null}

        {progressStep === TransactionProgressStep.WalletConfirmation ? (
          <SwapConfirmationStep
            fromToken={fromToken}
            toToken={toToken}
            fromAmountFormatted={fromAmountFormatted}
            toAmountFormatted={toAmountFormatted}
          />
        ) : null}
        {/* {progressStep === TransactionProgressStep.Validating ? (
          <ValidatingStep
            currentStep={currentStep}
            currentStepItem={currentStepItem}
          />
        ) : null} */}
        {progressStep === TransactionProgressStep.Success ? (
          <SwapSuccessStep
            fromToken={fromToken}
            toToken={toToken}
            fromAmountFormatted={fromAmountFormatted}
            toAmountFormatted={toAmountFormatted}
            allTxHashes={allTxHashes}
            transaction={transaction}
            fillTime={fillTime}
            seconds={seconds ?? 0}
            onOpenChange={onOpenChange}
            timeEstimate={timeEstimate?.formattedTime}
            isCanonical={false}
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
            fromChain={fromChain}
          />
        ) : null}
      </Flex>
    </Modal>
  )
}
