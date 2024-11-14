import {
  type FC,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
  type SetStateAction,
  type Dispatch,
  useContext,
  useCallback
} from 'react'
import { parseUnits, type Address } from 'viem'
import {
  type AdaptedWallet,
  type Execute,
  type RelayChain
} from '@reservoir0x/relay-sdk'
import {
  calculateFillTime,
  extractDepositRequestId
} from '../../../utils/relayTransaction.js'
import type { Token } from '../../../types/index.js'
import { useQuote, useRequests } from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from '../../../hooks/index.js'
import { EventNames } from '../../../constants/events.js'
import { ProviderOptionsContext } from '../../../providers/RelayKitProvider.js'
import { useAccount } from 'wagmi'
import { extractQuoteId } from '../../../utils/quote.js'
import { getDeadAddress } from '@reservoir0x/relay-sdk'

export enum TransactionProgressStep {
  WaitingForDeposit,
  WalletConfirmation,
  Validating,
  Success,
  Error
}

export type TxHashes = { txHash: string; chainId: number }[]

export type ChildrenProps = {
  progressStep: TransactionProgressStep
  setProgressStep: Dispatch<SetStateAction<TransactionProgressStep>>
  quote: ReturnType<typeof useQuote>['data']
  isFetchingQuote: boolean
  isRefetchingQuote: boolean
  quoteError: Error | null
  swapError: Error | null
  setSwapError: Dispatch<SetStateAction<Error | null>>
  allTxHashes: TxHashes
  setAllTxHashes: Dispatch<SetStateAction<TxHashes>>
  transaction?: ReturnType<typeof useRequests>['data']['0']
  seconds: number
  fillTime: string
  requestId: string | null
  quoteUpdatedAt: number
}

type Props = {
  open: boolean
  address?: string
  fromToken?: Token
  fromChain?: RelayChain
  toToken?: Token
  debouncedOutputAmountValue: string
  debouncedInputAmountValue: string
  amountInputValue: string
  amountOutputValue: string
  recipient?: string
  refundAddress?: string
  customToAddress?: Address
  wallet?: AdaptedWallet
  invalidateBalanceQueries: () => void
  children: (props: ChildrenProps) => ReactNode
  onSuccess?: (quote: ReturnType<typeof useQuote>['data']) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapError?: (error: string, data?: Execute) => void
  onValidating?: (quote: Execute) => void
}

export const DepositAddressModalRenderer: FC<Props> = ({
  open,
  address,
  fromChain,
  fromToken,
  toToken,
  debouncedInputAmountValue,
  debouncedOutputAmountValue,
  amountInputValue,
  amountOutputValue,
  recipient,
  customToAddress,
  refundAddress,
  invalidateBalanceQueries,
  children,
  onSuccess,
  onAnalyticEvent,
  onSwapError,
  onValidating
}) => {
  const [progressStep, setProgressStep] = useState(
    TransactionProgressStep.WaitingForDeposit
  )
  const [allTxHashes, setAllTxHashes] = useState<TxHashes>([])
  const [swapError, setSwapError] = useState<Error | null>(null)

  const relayClient = useRelayClient()
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const { connector } = useAccount()
  const deadAddress = getDeadAddress(fromChain?.vmType, fromChain?.id)

  const {
    data: quote,
    isLoading: isFetchingQuote,
    isRefetching: isRefetchingQuote,
    error: quoteError,
    dataUpdatedAt: quoteUpdatedAt
  } = useQuote(
    relayClient ? relayClient : undefined,
    undefined,
    fromToken && toToken
      ? {
          user: address ?? deadAddress,
          originChainId: fromToken.chainId,
          destinationChainId: toToken.chainId,
          originCurrency: fromToken.address,
          destinationCurrency: toToken.address,
          recipient: recipient as string,
          tradeType: 'EXACT_INPUT',
          appFees: providerOptionsContext.appFees,
          amount: parseUnits(
            debouncedInputAmountValue,
            fromToken.decimals
          ).toString(),
          referrer: relayClient?.source ?? undefined,
          useDepositAddress: true,
          refundTo: refundAddress
        }
      : undefined,
    () => {},
    ({ steps, details }) => {
      onAnalyticEvent?.(EventNames.SWAP_EXECUTE_QUOTE_RECEIVED, {
        wallet_connector: connector?.name,
        quote_id: steps ? extractQuoteId(steps) : undefined,
        amount_in: details?.currencyIn?.amountFormatted,
        currency_in: details?.currencyIn?.currency?.symbol,
        chain_id_in: details?.currencyIn?.currency?.chainId,
        amount_out: details?.currencyOut?.amountFormatted,
        currency_out: details?.currencyOut?.currency?.symbol,
        chain_id_out: details?.currencyOut?.currency?.chainId,
        is_canonical: false,
        is_deposit_address: true
      })
    },
    {
      staleTime: 10000,
      enabled: Boolean(
        open &&
          progressStep === TransactionProgressStep.WaitingForDeposit &&
          relayClient &&
          debouncedInputAmountValue &&
          debouncedInputAmountValue.length > 0 &&
          Number(debouncedInputAmountValue) !== 0 &&
          fromToken !== undefined &&
          toToken !== undefined
      )
    }
  )

  // const swap = useCallback(async () => {
  //   const swapErrorHandler = (error: any) => {
  //     if (
  //       error &&
  //       ((typeof error.message === 'string' &&
  //         error.message.includes('rejected')) ||
  //         (typeof error === 'string' && error.includes('rejected')))
  //     ) {
  //       onAnalyticEvent?.(EventNames.USER_REJECTED_WALLET)
  //       setProgressStep(TransactionProgressStep.ReviewQuote)
  //       return
  //     }

  //     const errorMessage = error?.response?.data?.message
  //       ? new Error(error?.response?.data?.message)
  //       : error

  //     onAnalyticEvent?.(EventNames.SWAP_ERROR, {
  //       error_message: errorMessage,
  //       wallet_connector: connector?.name,
  //       quote_id: steps ? extractQuoteId(steps) : undefined,
  //       amount_in: parseFloat(`${debouncedInputAmountValue}`),
  //       currency_in: fromToken?.symbol,
  //       chain_id_in: fromToken?.chainId,
  //       amount_out: parseFloat(`${debouncedOutputAmountValue}`),
  //       currency_out: toToken?.symbol,
  //       chain_id_out: toToken?.chainId,
  //       is_canonical: useExternalLiquidity,
  //       txHashes: steps
  //         ?.map((step) => {
  //           let txHashes: { chainId: number; txHash: string }[] = []
  //           step.items?.forEach((item) => {
  //             if (item.txHashes) {
  //               txHashes = txHashes.concat([
  //                 ...(item.txHashes ?? []),
  //                 ...(item.internalTxHashes ?? [])
  //               ])
  //             }
  //           })
  //           return txHashes
  //         })
  //         .flat()
  //     })
  //     setSwapError(errorMessage)
  //     onSwapError?.(errorMessage, quote as Execute)
  //   }

  //   try {
  //     onAnalyticEvent?.(EventNames.SWAP_CTA_CLICKED)
  //     setWaitingForSteps(true)

  //     if (!executeSwap) {
  //       throw 'Missing a quote'
  //     }

  //     if (!wallet && !walletClient.data) {
  //       throw 'Missing a wallet'
  //     }

  //     const _wallet =
  //       wallet ?? adaptViemWallet(walletClient.data as WalletClient)

  //     const activeWalletChainId = await _wallet?.getChainId()

  //     if (fromToken && fromToken?.chainId !== activeWalletChainId) {
  //       onAnalyticEvent?.(EventNames.SWAP_SWITCH_NETWORK)
  //       await _wallet?.switchChain(fromToken.chainId)
  //     }

  //     setProgressStep(TransactionProgressStep.WalletConfirmation)

  //     executeSwap(({ steps: currentSteps }) => {
  //       setSteps(currentSteps)
  //     })
  //       ?.catch((error: any) => {
  //         swapErrorHandler(error)
  //       })
  //       .finally(() => {
  //         setWaitingForSteps(false)
  //         invalidateBalanceQueries()
  //       })
  //   } catch (error: any) {
  //     swapErrorHandler(error)
  //     setWaitingForSteps(false)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   relayClient,
  //   address,
  //   connector,
  //   wallet,
  //   walletClient,
  //   fromToken,
  //   toToken,
  //   customToAddress,
  //   recipient,
  //   debouncedInputAmountValue,
  //   debouncedOutputAmountValue,
  //   useExternalLiquidity,
  //   waitingForSteps,
  //   executeSwap,
  //   setSteps,
  //   invalidateBalanceQueries
  // ])

  // useEffect(() => {
  //   if (swapError || (quoteError && !isRefetchingQuote)) {
  //     setProgressStep(TransactionProgressStep.Error)
  //     return
  //   }
  //   if (!steps) {
  //     return
  //   }

  //   const executableSteps = steps.filter(
  //     (step) => step.items && step.items.length > 0
  //   )

  //   let stepCount = executableSteps.length
  //   let txHashes: TxHashes = []
  //   let currentStep: NonNullable<Execute['steps']>['0'] | null = null
  //   let currentStepItem:
  //     | NonNullable<Execute['steps'][0]['items']>[0]
  //     | undefined

  //   for (const step of executableSteps) {
  //     for (const item of step.items || []) {
  //       if (item.txHashes && item.txHashes.length > 0) {
  //         txHashes = item.txHashes.concat([...txHashes])
  //       }
  //       if (item.internalTxHashes && item.internalTxHashes.length > 0) {
  //         txHashes = item.internalTxHashes.concat([...txHashes])
  //       }
  //       if (item.status === 'incomplete') {
  //         currentStep = step
  //         currentStepItem = item

  //         break // Exit the inner loop once the first incomplete item is found
  //       }
  //     }
  //     if (currentStep && currentStepItem) break // Exit the outer loop if the current step and item have been found
  //   }

  //   setAllTxHashes(txHashes)

  //   if (
  //     (txHashes.length > 0 || currentStepItem?.isValidatingSignature == true) &&
  //     progressStep === TransactionProgressStep.WalletConfirmation
  //   ) {
  //     onValidating?.(quote as Execute)
  //     setProgressStep(TransactionProgressStep.Validating)
  //     setStartTimestamp(new Date().getTime())
  //   }

  //   if (!currentStep) {
  //     currentStep = executableSteps[stepCount - 1]
  //   }

  //   setCurrentStep(currentStep)
  //   setCurrentStepItem(currentStepItem)
  //   if (
  //     steps.every(
  //       (step) =>
  //         !step.items ||
  //         step.items.length == 0 ||
  //         step.items?.every((item) => item.status === 'complete')
  //     ) &&
  //     progressStep !== TransactionProgressStep.Success
  //   ) {
  //     setProgressStep(TransactionProgressStep.Success)
  //     onSuccess?.(quote, steps)
  //   }
  // }, [steps, quoteError, swapError])

  // Fetch Success Tx
  // const { data: transactions } = useRequests(
  //   (progressStep === TransactionProgressStep.Success ||
  //     progressStep === TransactionProgressStep.Error) &&
  //     allTxHashes[0]
  //     ? {
  //         user: address,
  //         hash: allTxHashes[0]?.txHash
  //       }
  //     : undefined,
  //   relayClient?.baseApiUrl,
  //   {
  //     enabled:
  //       (progressStep === TransactionProgressStep.Success ||
  //         progressStep === TransactionProgressStep.Error) &&
  //       allTxHashes[0]
  //         ? true
  //         : false
  //   }
  // )

  //TODO
  const transaction = null
  const { fillTime, seconds } = calculateFillTime(transaction)

  const requestId = useMemo(
    () => extractDepositRequestId(quote?.steps as Execute['steps']),
    [quote]
  )

  return (
    <>
      {children({
        progressStep,
        setProgressStep,
        quote,
        isFetchingQuote,
        isRefetchingQuote,
        quoteError,
        swapError,
        setSwapError,
        allTxHashes,
        setAllTxHashes,
        transaction: undefined,
        fillTime,
        seconds,
        quoteUpdatedAt,
        requestId
      })}
    </>
  )
}
