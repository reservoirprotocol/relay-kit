import {
  getDeadAddress,
  type Execute,
  type RelayChain
} from '@reservoir0x/relay-sdk'
import { type FC, useEffect, useMemo, useState } from 'react'
import { Modal } from '../../../common/Modal.js'
import type { FiatCurrency, Token } from '../../../../types/index.js'
import useRelayClient from '../../../../hooks/useRelayClient.js'
import { EventNames } from '../../../../constants/events.js'
import {
  useExecutionStatus,
  useQuote,
  useRequests
} from '@reservoir0x/relay-kit-hooks'
import { extractDepositRequestId } from '../../../../utils/relayTransaction.js'
import { parseUnits } from 'viem'
import { extractDepositAddress } from '../../../../utils/quote.js'
import { getTxBlockExplorerUrl } from '../../../../utils/getTxBlockExplorerUrl.js'
import { OnrampConfirmingStep } from './steps/OnrampConfirmingStep.js'
import { OnrampProcessingStepUI } from './steps/OnrampProcessingStepUI.js'
import { OnrampSuccessStep } from './steps/OnrampSuccessStep.js'
import { OnrampMoonPayStep } from './steps/OnrampMoonPayStep.js'

export enum OnrampStep {
  Confirming,
  Moonpay,
  Processing,
  Success,
  Error
}

export enum OnrampProcessingStep {
  Finalizing,
  Relaying
}

type OnrampModalProps = {
  open: boolean
  amount?: string
  fromToken: Token
  fromChain?: RelayChain
  toToken: Token
  toChain?: RelayChain
  fiatCurrency: FiatCurrency
  recipient?: string
  moonpayOnUrlSignatureRequested: (url: string) => Promise<string> | void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  //TODO add success data
  onSuccess?: () => void
}

export const OnrampModal: FC<OnrampModalProps> = ({
  open,
  amount,
  recipient,
  fromToken,
  toToken,
  toChain,
  fromChain,
  fiatCurrency,
  moonpayOnUrlSignatureRequested,
  onAnalyticEvent,
  onSuccess,
  onOpenChange
}) => {
  const [step, setStep] = useState<OnrampStep>(OnrampStep.Confirming)
  const [processingStep, setProcessingStep] = useState<
    OnrampProcessingStep | undefined
  >()
  const [moonPayRequestId, setMoonPayRequestId] = useState<string | undefined>()
  const client = useRelayClient()

  useEffect(() => {
    if (!open) {
      setStep(OnrampStep.Confirming)
      setProcessingStep(undefined)
      setMoonPayRequestId(undefined)
    }
  }, [open])

  const quote = useQuote(
    client ?? undefined,
    undefined,
    {
      originChainId: fromToken.chainId,
      originCurrency: fromToken.address,
      destinationChainId: toToken.chainId,
      destinationCurrency: toToken.address,
      useDepositAddress: true,
      tradeType: 'EXACT_INPUT',
      amount: parseUnits(`${amount}`, 6).toString(),
      user: getDeadAddress(),
      recipient: recipient
    },
    undefined,
    undefined,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: Boolean(
        amount &&
          amount.length > 0 &&
          toToken &&
          fromToken &&
          recipient !== undefined &&
          open
      )
    }
  )

  const totalAmount =
    quote.data?.fees && amount
      ? `${
          Math.floor(
            (Number(quote.data.fees.relayer?.amountUsd ?? 0) +
              Number(quote.data.fees.gas?.amountUsd ?? 0) +
              Number(quote.data.fees.app?.amountUsd ?? 0) +
              +amount) *
              100
          ) / 100
        }`
      : null

  const depositAddress = useMemo(
    () => extractDepositAddress(quote?.data?.steps as Execute['steps']),
    [quote]
  )

  const baseTransactionUrl = client?.baseApiUrl.includes('testnets')
    ? 'https://testnets.relay.link'
    : 'https://relay.link'

  const requestId = useMemo(
    () => extractDepositRequestId(quote?.data?.steps as Execute['steps']),
    [quote]
  )

  const { data: executionStatus } = useExecutionStatus(
    client ? client : undefined,
    {
      requestId: requestId ?? undefined
    },
    undefined,
    undefined,
    {
      enabled: requestId !== null && step === OnrampStep.Processing && open,
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

  const fillTxHash = useMemo(() => {
    if (executionStatus?.txHashes && executionStatus?.txHashes[0]) {
      return executionStatus?.txHashes[0]
    }
  }, [executionStatus])

  const { data: transactions, isLoading: isLoadingTransaction } = useRequests(
    step === OnrampStep.Success && fillTxHash
      ? {
          user: recipient,
          hash: fillTxHash
        }
      : undefined,
    client?.baseApiUrl,
    {
      enabled: Boolean(step === OnrampStep.Success && fillTxHash),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      retryOnMount: false
    }
  )

  const transaction = transactions && transactions[0] ? transactions[0] : null
  const toAmountFormatted =
    transaction?.data?.metadata?.currencyOut?.amountFormatted ?? undefined

  const fillTxUrl = fillTxHash
    ? getTxBlockExplorerUrl(toToken.chainId, client?.chains, fillTxHash)
    : undefined

  const moonpayTxUrl = moonPayRequestId
    ? `https://buy.moonpay.com/transaction_receipt?transactionId=${moonPayRequestId}`
    : null

  useEffect(() => {
    if (
      executionStatus?.status === 'pending' &&
      (step !== OnrampStep.Processing ||
        processingStep !== OnrampProcessingStep.Relaying)
    ) {
      setStep(OnrampStep.Processing)
      setProcessingStep(OnrampProcessingStep.Relaying)
    }
    if (executionStatus?.status === 'success') {
      setStep(OnrampStep.Success)
      onAnalyticEvent?.(EventNames.ONRAMP_SUCCESS, {
        chain_id_in: fromToken?.chainId,
        currency_in: fromToken?.symbol,
        chain_id_out: toToken?.chainId,
        currency_out: toToken?.symbol,
        quote_id: requestId,
        txHashes: executionStatus.txHashes
      })
      onSuccess?.()
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
      {step === OnrampStep.Confirming ? (
        <OnrampConfirmingStep
          toToken={toToken}
          fromToken={fromToken}
          fromChain={fromChain}
          toChain={toChain}
          requestId={requestId ?? undefined}
          depositAddress={depositAddress}
          recipient={recipient}
          amount={amount}
          totalAmount={totalAmount ?? undefined}
          isFetchingQuote={quote.isFetching}
          onAnalyticEvent={onAnalyticEvent}
          setStep={setStep}
        />
      ) : null}
      <OnrampMoonPayStep
        step={step}
        processingStep={processingStep}
        toToken={toToken}
        fromToken={fromToken}
        fromChain={fromChain}
        depositAddress={depositAddress}
        totalAmount={totalAmount ?? undefined}
        fiatCurrency={fiatCurrency}
        onAnalyticEvent={onAnalyticEvent}
        setStep={setStep}
        setProcessingStep={setProcessingStep}
        setMoonPayRequestId={setMoonPayRequestId}
        moonpayOnUrlSignatureRequested={moonpayOnUrlSignatureRequested}
      />
      {step === OnrampStep.Processing ? (
        <OnrampProcessingStepUI
          toToken={toToken}
          fromToken={fromToken}
          fromChain={fromChain}
          toChain={toChain}
          moonpayTxUrl={moonpayTxUrl ?? undefined}
          fillTxUrl={fillTxUrl}
          fillTxHash={fillTxHash}
          processingStep={processingStep}
          baseTransactionUrl={baseTransactionUrl}
          requestId={requestId ?? undefined}
        />
      ) : null}
      {step === OnrampStep.Success ? (
        <OnrampSuccessStep
          toToken={toToken}
          isLoadingTransaction={isLoadingTransaction}
          fillTxHash={fillTxHash}
          fillTxUrl={fillTxUrl}
          moonpayTxUrl={moonpayTxUrl ?? undefined}
          toAmountFormatted={toAmountFormatted}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Modal>
  )
}
