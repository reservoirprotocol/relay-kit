import { Flex, Button, Text, Box } from '../../primitives/index.js'
import { useContext, useEffect, useMemo, useState, type FC } from 'react'
import { useRelayClient } from '../../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { usePublicClient } from 'wagmi'
import type { LinkedWallet, Token } from '../../../types/index.js'
import { formatFixedLength, formatDollar } from '../../../utils/numbers.js'
import AmountInput from '../../common/AmountInput.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown'
import type { ChainVM, Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { getFeeBufferAmount } from '../../../utils/nativeMaxAmount.js'
import { WidgetErrorWell } from '../WidgetErrorWell.js'
import { BalanceDisplay } from '../../common/BalanceDisplay.js'
import { EventNames } from '../../../constants/events.js'
import SwapWidgetRenderer from '../SwapWidgetRenderer.js'
import WidgetContainer from '../WidgetContainer.js'
import SwapButton from '../SwapButton.js'
import TokenSelectorContainer from '../TokenSelectorContainer.js'
import FeeBreakdown from '../FeeBreakdown.js'
import { faClipboard } from '@fortawesome/free-solid-svg-icons'
import { TokenTrigger } from '../../common/TokenSelector/triggers/TokenTrigger.js'
import type { AdaptedWallet } from '@reservoir0x/relay-sdk'
import { MultiWalletDropdown } from '../../common/MultiWalletDropdown.js'
import { findSupportedWallet } from '../../../utils/address.js'
import {
  evmDeadAddress,
  solDeadAddress,
  bitcoinDeadAddress
} from '@reservoir0x/relay-sdk'
import SwapRouteSelector from '../SwapRouteSelector.js'
import { ProviderOptionsContext } from '../../../providers/RelayKitProvider.js'
import { findBridgableToken } from '../../../utils/tokens.js'
import { isChainLocked } from '../../../utils/tokenSelector.js'
import TokenSelector from '../../common/TokenSelector/TokenSelector.js'
import { UnverifiedTokenModal } from '../../common/UnverifiedTokenModal.js'
import { alreadyAcceptedToken } from '../../../utils/localStorage.js'
import GasTopUpSection from './GasTopUpSection.js'
import { useTokenPrice } from '@reservoir0x/relay-kit-hooks'
import { getSwapEventData } from '../../../utils/quote.js'

// shared query options for useTokenPrice
const tokenPriceQueryOptions = {
  staleTime: 60 * 1000, // 1 minute
  refetchInterval: 30 * 1000, // 30 seconds
  refetchOnWindowFocus: false
}

type BaseSwapWidgetProps = {
  fromToken?: Token
  setFromToken?: (token?: Token) => void
  toToken?: Token
  setToToken?: (token?: Token) => void
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: 'EXACT_INPUT' | 'EXPECTED_OUTPUT'
  slippageTolerance?: string
  lockToToken?: boolean
  lockFromToken?: boolean
  lockChainId?: number
  singleChainMode?: boolean
  wallet?: AdaptedWallet
  supportedWalletVMs: Omit<ChainVM, 'hypevm'>[]
  disableInputAutoFocus?: boolean
  popularChainIds?: number[]
  disablePasteWalletAddressOption?: boolean
  onFromTokenChange?: (token?: Token) => void
  onToTokenChange?: (token?: Token) => void
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapValidating?: (data: Execute) => void
  onSwapSuccess?: (data: Execute) => void
  onSwapError?: (error: string, data?: Execute) => void
}

type MultiWalletDisabledProps = BaseSwapWidgetProps & {
  multiWalletSupportEnabled?: false
  linkedWallets?: never
  onSetPrimaryWallet?: never
  onLinkNewWallet?: never
}

type MultiWalletEnabledProps = BaseSwapWidgetProps & {
  multiWalletSupportEnabled: true
  linkedWallets: LinkedWallet[]
  onSetPrimaryWallet?: (address: string) => void
  onLinkNewWallet: (params: {
    chain?: RelayChain
    direction: 'to' | 'from'
  }) => Promise<LinkedWallet> | void
}

export type SwapWidgetProps = MultiWalletDisabledProps | MultiWalletEnabledProps

const SwapWidget: FC<SwapWidgetProps> = ({
  fromToken,
  setFromToken,
  toToken,
  setToToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  slippageTolerance,
  lockToToken = false,
  lockFromToken = false,
  lockChainId,
  singleChainMode = false,
  wallet,
  multiWalletSupportEnabled = false,
  linkedWallets,
  supportedWalletVMs,
  disableInputAutoFocus = false,
  popularChainIds,
  disablePasteWalletAddressOption,
  onSetPrimaryWallet,
  onLinkNewWallet,
  onFromTokenChange,
  onToTokenChange,
  onConnectWallet,
  onAnalyticEvent,
  onSwapSuccess,
  onSwapValidating,
  onSwapError
}): JSX.Element => {
  const relayClient = useRelayClient()
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const connectorKeyOverrides = providerOptionsContext.vmConnectorKeyOverrides
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [depositAddressModalOpen, setDepositAddressModalOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [pendingSuccessFlush, setPendingSuccessFlush] = useState(false)
  const [unverifiedTokens, setUnverifiedTokens] = useState<
    { token: Token; context: 'to' | 'from' }[]
  >([])
  const hasLockedToken = lockFromToken || lockToToken
  const isSingleChainLocked = singleChainMode && lockChainId !== undefined

  //Handle external unverified tokens
  useEffect(() => {
    if (fromToken && 'verified' in fromToken && !fromToken.verified) {
      const isAlreadyAccepted = alreadyAcceptedToken(fromToken)
      if (!isAlreadyAccepted) {
        unverifiedTokens.push({ token: fromToken, context: 'from' })
        setFromToken?.(undefined)
      }
    }
    if (toToken && 'verified' in toToken && !toToken.verified) {
      const isAlreadyAccepted = alreadyAcceptedToken(toToken)
      if (!isAlreadyAccepted) {
        unverifiedTokens.push({ token: toToken, context: 'to' })
        setToToken?.(undefined)
      }
    }
  }, [fromToken, toToken])

  return (
    <SwapWidgetRenderer
      context="Swap"
      transactionModalOpen={transactionModalOpen}
      setTransactionModalOpen={setTransactionModalOpen}
      depositAddressModalOpen={depositAddressModalOpen}
      defaultAmount={defaultAmount}
      defaultToAddress={defaultToAddress}
      defaultTradeType={defaultTradeType}
      toToken={toToken}
      setToToken={setToToken}
      fromToken={fromToken}
      setFromToken={setFromToken}
      slippageTolerance={slippageTolerance}
      wallet={wallet}
      linkedWallets={linkedWallets}
      multiWalletSupportEnabled={multiWalletSupportEnabled}
      onSwapError={onSwapError}
      onAnalyticEvent={onAnalyticEvent}
      supportedWalletVMs={supportedWalletVMs}
    >
      {({
        quote,
        steps,
        swap,
        setSteps,
        feeBreakdown,
        fromToken,
        setFromToken,
        toToken,
        setToToken,
        error,
        toDisplayName,
        address,
        recipient,
        customToAddress,
        setCustomToAddress,
        tradeType,
        setTradeType,
        isSameCurrencySameRecipientSwap,
        debouncedInputAmountValue,
        debouncedAmountInputControls,
        setAmountInputValue,
        amountInputValue,
        amountOutputValue,
        debouncedOutputAmountValue,
        debouncedAmountOutputControls,
        setAmountOutputValue,
        toBalance,
        toBalancePending,
        isLoadingToBalance,
        isFetchingQuote,
        isLoadingFromBalance,
        fromBalance,
        fromBalancePending,
        highRelayerServiceFee,
        relayerFeeProportion,
        hasInsufficientBalance,
        isInsufficientLiquidityError,
        isCapacityExceededError,
        isCouldNotExecuteError,
        ctaCopy,
        isFromNative,
        timeEstimate,
        isSvmSwap,
        isBvmSwap,
        isValidFromAddress,
        isValidToAddress,
        supportsExternalLiquidity,
        useExternalLiquidity,
        slippageTolerance,
        canonicalTimeEstimate,
        fromChainWalletVMSupported,
        toChainWalletVMSupported,
        isRecipientLinked,
        swapError,
        recipientWalletSupportsChain,
        gasTopUpEnabled,
        setGasTopUpEnabled,
        gasTopUpRequired,
        gasTopUpAmount,
        gasTopUpAmountUsd,
        linkedWallet,
        quoteParameters,
        setSwapError,
        setUseExternalLiquidity,
        invalidateBalanceQueries,
        invalidateQuoteQuery,
        quoteInProgress,
        setQuoteInProgress,
        abortController
      }) => {
        // helper to calculate the USD value of a token
        const calculateUsdValue = (
          price?: number,
          amountString?: string
        ): number | undefined => {
          if (price && price > 0 && amountString && Number(amountString) > 0) {
            try {
              return parseFloat(amountString) * price
            } catch (e) {
              console.error(
                'Failed to parse amount string for USD calculation',
                amountString,
                e
              )
            }
          }
          return undefined
        }

        //  Retrieve the price of the `from` token
        const { data: fromTokenPriceData, isLoading: isLoadingFromTokenPrice } =
          useTokenPrice(
            relayClient?.baseApiUrl,
            {
              address: fromToken?.address ?? '',
              chainId: fromToken?.chainId ?? 0,
              referrer: relayClient?.source
            },
            {
              enabled: !!(
                fromToken?.address &&
                fromToken.chainId &&
                amountInputValue &&
                Number(amountInputValue) > 0
              ),
              ...tokenPriceQueryOptions
            }
          )

        // Retrieve the price of the `to` token
        const { data: toTokenPriceData, isLoading: isLoadingToTokenPrice } =
          useTokenPrice(
            relayClient?.baseApiUrl,
            {
              address: toToken?.address ?? '',
              chainId: toToken?.chainId ?? 0,
              referrer: relayClient?.source
            },
            {
              enabled: !!(
                toToken?.address &&
                toToken.chainId &&
                amountOutputValue &&
                Number(amountOutputValue) > 0
              ),
              ...tokenPriceQueryOptions
            }
          )

        // Calculate the USD value of the input amount
        const inputAmountUsd = useMemo(() => {
          return calculateUsdValue(fromTokenPriceData?.price, amountInputValue)
        }, [fromTokenPriceData, amountInputValue])

        // Calculate the USD value of the output amount
        const outputAmountUsd = useMemo(() => {
          return calculateUsdValue(toTokenPriceData?.price, amountOutputValue)
        }, [toTokenPriceData, amountOutputValue])

        const handleMaxAmountClicked = async (
          amount: bigint,
          percent: string,
          bufferAmount?: bigint
        ) => {
          if (fromToken) {
            setAmountInputValue(formatUnits(amount, fromToken?.decimals))
            setTradeType('EXACT_INPUT')
            debouncedAmountOutputControls.cancel()
            debouncedAmountInputControls.flush()
            onAnalyticEvent?.(EventNames.MAX_AMOUNT_CLICKED, {
              percent: percent,
              bufferAmount: bufferAmount ? bufferAmount.toString() : '0',
              chainType: fromChain?.vmType
            })
          }
        }

        const handleSetFromToken = (token?: Token) => {
          if (!token) {
            setFromToken(undefined)
            onFromTokenChange?.(undefined)
            return
          }

          let _token = token
          const newFromChain = relayClient?.chains.find(
            (chain) => token?.chainId == chain.id
          )
          if (
            newFromChain?.vmType &&
            !supportedWalletVMs.includes(newFromChain?.vmType)
          ) {
            setTradeType('EXACT_INPUT')

            const _toToken = findBridgableToken(toChain, toToken)

            if (_toToken && _toToken?.address != toToken?.address) {
              handleSetToToken(_toToken)
            }

            const _fromToken = findBridgableToken(newFromChain, _token)
            if (_fromToken && _fromToken.address != _token?.address) {
              _token = _fromToken
            }
          }
          setFromToken(_token)
          onFromTokenChange?.(_token)
        }
        const handleSetToToken = (token?: Token) => {
          if (!token) {
            setToToken(undefined)
            onToTokenChange?.(undefined)
            return
          }

          let _token = token
          if (!fromChainWalletVMSupported) {
            const newToChain = relayClient?.chains.find(
              (chain) => token?.chainId == chain.id
            )
            if (newToChain) {
              const _toToken = findBridgableToken(newToChain, _token)
              if (_toToken && _toToken.address != _token?.address) {
                _token = _toToken
              }
            }
          }
          setToToken(_token)
          onToTokenChange?.(_token)
        }

        const fromChain = relayClient?.chains?.find(
          (chain) => chain.id === fromToken?.chainId
        )

        const toChain = relayClient?.chains?.find(
          (chain) => chain.id === toToken?.chainId
        )

        // Get public client for the fromChain to estimate gas
        const publicClient = usePublicClient({ chainId: fromChain?.id })

        useEffect(() => {
          if (
            multiWalletSupportEnabled &&
            fromChain &&
            address &&
            linkedWallets &&
            !isValidFromAddress
          ) {
            const supportedAddress = findSupportedWallet(
              fromChain,
              address,
              linkedWallets,
              connectorKeyOverrides
            )
            if (supportedAddress) {
              onSetPrimaryWallet?.(supportedAddress)
            }
          }

          if (
            multiWalletSupportEnabled &&
            toChain &&
            recipient &&
            linkedWallets &&
            !isValidToAddress
          ) {
            const supportedAddress = findSupportedWallet(
              toChain,
              recipient,
              linkedWallets,
              connectorKeyOverrides
            )
            if (supportedAddress) {
              setCustomToAddress(supportedAddress)
            } else {
              setCustomToAddress(undefined)
            }
          }
        }, [
          multiWalletSupportEnabled,
          fromChain?.id,
          toChain?.id,
          address,
          linkedWallets,
          onSetPrimaryWallet,
          isValidFromAddress,
          isValidToAddress,
          connectorKeyOverrides
        ])

        //Handle if the paste wallet address option is disabled while there is a custom to address
        useEffect(() => {
          if (disablePasteWalletAddressOption && customToAddress) {
            setCustomToAddress(undefined)
          }
        }, [disablePasteWalletAddressOption])

        const promptSwitchRoute =
          (isCapacityExceededError || isCouldNotExecuteError) &&
          supportsExternalLiquidity &&
          !isSingleChainLocked

        const isAutoSlippage = slippageTolerance === undefined

        const isHighPriceImpact =
          Number(quote?.details?.totalImpact?.percent) < -3.5
        const totalImpactUsd = quote?.details?.totalImpact?.usd
        const showHighPriceImpactWarning = Boolean(
          isHighPriceImpact && totalImpactUsd && Number(totalImpactUsd) <= -10
        )

        return (
          <WidgetContainer
            steps={steps}
            setSteps={setSteps}
            quoteInProgress={quoteInProgress}
            setQuoteInProgress={setQuoteInProgress}
            transactionModalOpen={transactionModalOpen}
            setTransactionModalOpen={setTransactionModalOpen}
            depositAddressModalOpen={depositAddressModalOpen}
            setDepositAddressModalOpen={setDepositAddressModalOpen}
            addressModalOpen={addressModalOpen}
            setAddressModalOpen={setAddressModalOpen}
            fromToken={fromToken}
            fromChain={fromChain}
            toToken={toToken}
            toChain={toChain}
            address={address}
            recipient={recipient}
            amountInputValue={amountInputValue}
            amountOutputValue={amountOutputValue}
            debouncedInputAmountValue={debouncedInputAmountValue}
            debouncedOutputAmountValue={debouncedOutputAmountValue}
            tradeType={tradeType}
            onTransactionModalOpenChange={(open) => {
              if (!open) {
                if (pendingSuccessFlush) {
                  setPendingSuccessFlush(false)
                } else if (steps) {
                  invalidateQuoteQuery()
                }
                // Abort ongoing execution
                if (abortController) {
                  abortController.abort()
                }
                setSwapError(null)
                setSteps(null)
                setQuoteInProgress(null)
              } else if (pendingSuccessFlush) {
                setPendingSuccessFlush(false)
              }
            }}
            onDepositAddressModalOpenChange={(open) => {
              if (!open) {
                setSwapError(null)
                if (pendingSuccessFlush) {
                  setPendingSuccessFlush(false)
                } else {
                  invalidateQuoteQuery()
                }
              } else if (pendingSuccessFlush) {
                setPendingSuccessFlush(false)
              }
            }}
            useExternalLiquidity={useExternalLiquidity}
            slippageTolerance={slippageTolerance}
            swapError={swapError}
            setSwapError={setSwapError}
            onSwapSuccess={(data) => {
              setPendingSuccessFlush(true)
              setGasTopUpEnabled(true)
              setAmountInputValue('')
              setAmountOutputValue('')
              onSwapSuccess?.(data)
            }}
            onSwapValidating={onSwapValidating}
            onAnalyticEvent={onAnalyticEvent}
            invalidateBalanceQueries={invalidateBalanceQueries}
            invalidateQuoteQuery={invalidateQuoteQuery}
            customToAddress={customToAddress}
            setCustomToAddress={setCustomToAddress}
            timeEstimate={timeEstimate}
            wallet={wallet}
            linkedWallets={linkedWallets}
            multiWalletSupportEnabled={multiWalletSupportEnabled}
          >
            {() => {
              return (
                <>
                  <Flex
                    direction="column"
                    css={{
                      width: '100%',
                      overflow: 'hidden',
                      border: 'widget-border',
                      minWidth: 300,
                      maxWidth: 408
                    }}
                  >
                    <TokenSelectorContainer
                      css={{ backgroundColor: 'widget-background' }}
                      id={'from-token-section'}
                    >
                      <Flex
                        align="center"
                        justify="between"
                        css={{ gap: '2', width: '100%' }}
                      >
                        <Text style="subtitle2" color="subtle">
                          Sell
                        </Text>
                        {multiWalletSupportEnabled === true &&
                        fromChainWalletVMSupported ? (
                          <MultiWalletDropdown
                            context="origin"
                            selectedWalletAddress={address}
                            disablePasteWalletAddressOption={
                              disablePasteWalletAddressOption
                            }
                            onSelect={(wallet) =>
                              onSetPrimaryWallet?.(wallet.address)
                            }
                            chain={fromChain}
                            onLinkNewWallet={() => {
                              if (!address && fromChainWalletVMSupported) {
                                onConnectWallet?.()
                              } else {
                                onLinkNewWallet?.({
                                  chain: fromChain,
                                  direction: 'from'
                                })?.then((wallet) => {
                                  onSetPrimaryWallet?.(wallet.address)
                                })
                              }
                            }}
                            setAddressModalOpen={setAddressModalOpen}
                            wallets={linkedWallets!}
                            onAnalyticEvent={onAnalyticEvent}
                          />
                        ) : null}
                      </Flex>

                      <Flex
                        align="center"
                        justify="between"
                        css={{ gap: '4', width: '100%' }}
                      >
                        <AmountInput
                          autoFocus={!disableInputAutoFocus}
                          value={
                            tradeType === 'EXACT_INPUT'
                              ? amountInputValue
                              : amountInputValue
                                ? formatFixedLength(amountInputValue, 8)
                                : amountInputValue
                          }
                          setValue={(e) => {
                            setAmountInputValue(e)
                            setTradeType('EXACT_INPUT')
                            if (Number(e) === 0) {
                              setAmountOutputValue('')
                              debouncedAmountInputControls.flush()
                            }
                          }}
                          onFocus={() => {
                            onAnalyticEvent?.(EventNames.SWAP_INPUT_FOCUSED)
                          }}
                          css={{
                            fontWeight: '700',
                            fontSize: 32,
                            lineHeight: '36px',
                            py: 0,
                            color:
                              isFetchingQuote && tradeType === 'EXPECTED_OUTPUT'
                                ? 'text-subtle'
                                : 'input-color',
                            _placeholder: {
                              color:
                                isFetchingQuote &&
                                tradeType === 'EXPECTED_OUTPUT'
                                  ? 'text-subtle'
                                  : 'input-color'
                            }
                          }}
                        />
                        <TokenSelector
                          address={address}
                          isValidAddress={isValidFromAddress}
                          token={fromToken}
                          onAnalyticEvent={onAnalyticEvent}
                          fromChainWalletVMSupported={
                            fromChainWalletVMSupported
                          }
                          supportedWalletVMs={supportedWalletVMs}
                          setToken={(token) => {
                            if (
                              token.address === toToken?.address &&
                              token.chainId === toToken?.chainId &&
                              address === recipient &&
                              (!lockToToken || !fromToken)
                            ) {
                              handleSetFromToken(toToken)
                              handleSetToToken(fromToken)
                            } else {
                              handleSetFromToken(token)
                            }
                          }}
                          context="from"
                          multiWalletSupportEnabled={multiWalletSupportEnabled}
                          lockedChainIds={
                            isSingleChainLocked
                              ? [lockChainId]
                              : isChainLocked(
                                    fromToken?.chainId,
                                    lockChainId,
                                    toToken?.chainId,
                                    lockFromToken
                                  ) && fromToken?.chainId
                                ? [fromToken.chainId]
                                : undefined
                          }
                          chainIdsFilter={
                            !fromChainWalletVMSupported && toToken
                              ? [toToken.chainId]
                              : undefined
                          }
                          popularChainIds={popularChainIds}
                          trigger={
                            <div style={{ width: 'max-content' }}>
                              <TokenTrigger
                                token={fromToken}
                                locked={lockFromToken}
                                isSingleChainLocked={isSingleChainLocked}
                                address={address}
                              />
                            </div>
                          }
                        />
                      </Flex>
                      <Flex
                        align="center"
                        justify="between"
                        css={{ gap: '3', width: '100%' }}
                      >
                        <Text
                          style="subtitle3"
                          color="subtleSecondary"
                          css={{
                            minHeight: 18,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {quote?.details?.currencyIn?.amountUsd &&
                          !isFetchingQuote ? (
                            formatDollar(
                              Number(quote.details.currencyIn.amountUsd)
                            )
                          ) : isLoadingFromTokenPrice &&
                            amountInputValue &&
                            Number(amountInputValue) > 0 ? (
                            <Box
                              css={{
                                width: 45,
                                height: 12,
                                backgroundColor: 'gray7',
                                borderRadius: 'widget-border-radius'
                              }}
                            />
                          ) : inputAmountUsd &&
                            inputAmountUsd > 0 &&
                            fromTokenPriceData?.price &&
                            fromTokenPriceData.price > 0 ? (
                            formatDollar(inputAmountUsd)
                          ) : null}
                        </Text>
                        <Flex
                          align="center"
                          css={{ gap: '3', marginLeft: 'auto', height: 23 }}
                        >
                          {fromToken ? (
                            <BalanceDisplay
                              isLoading={isLoadingFromBalance}
                              balance={fromBalance}
                              decimals={fromToken?.decimals}
                              symbol={fromToken?.symbol}
                              hasInsufficientBalance={hasInsufficientBalance}
                              displaySymbol={false}
                              isConnected={
                                address !== evmDeadAddress &&
                                address !== solDeadAddress &&
                                address !== bitcoinDeadAddress &&
                                address !== undefined
                              }
                              pending={fromBalancePending}
                            />
                          ) : (
                            <Flex css={{ height: 18 }} />
                          )}
                          {fromBalance &&
                          (fromChain?.vmType === 'evm' || // EVM
                            fromChain?.vmType === 'svm') ? (
                            <Flex css={{ gap: '1' }}>
                              <Button
                                aria-label="20%"
                                css={{
                                  fontSize: 12,
                                  fontWeight: '500',
                                  px: '1',
                                  py: '1',
                                  minHeight: '23px',
                                  lineHeight: '100%',
                                  backgroundColor: 'widget-selector-background',
                                  border: 'none',
                                  _hover: {
                                    backgroundColor:
                                      'widget-selector-hover-background'
                                  }
                                }}
                                color="white"
                                onClick={() => {
                                  const percentageBuffer =
                                    (fromBalance * 20n) / 100n // 20% of the balance
                                  handleMaxAmountClicked(
                                    percentageBuffer,
                                    '20%'
                                  )
                                }}
                              >
                                20%
                              </Button>
                              <Button
                                aria-label="50%"
                                css={{
                                  fontSize: 12,
                                  fontWeight: '500',
                                  px: '1',
                                  py: '1',
                                  minHeight: '23px',
                                  lineHeight: '100%',
                                  backgroundColor: 'widget-selector-background',
                                  border: 'none',
                                  _hover: {
                                    backgroundColor:
                                      'widget-selector-hover-background'
                                  }
                                }}
                                color="white"
                                onClick={() => {
                                  const percentageBuffer =
                                    (fromBalance * 50n) / 100n // 50% of the balance
                                  handleMaxAmountClicked(
                                    percentageBuffer,
                                    '50%'
                                  )
                                }}
                              >
                                50%
                              </Button>
                              <Button
                                aria-label="MAX"
                                css={{
                                  fontSize: 12,
                                  fontWeight: '500',
                                  px: '1',
                                  py: '1',
                                  minHeight: '23px',
                                  lineHeight: '100%',
                                  backgroundColor: 'widget-selector-background',
                                  border: 'none',
                                  _hover: {
                                    backgroundColor:
                                      'widget-selector-hover-background'
                                  }
                                }}
                                color="white"
                                onMouseEnter={() => {
                                  if (
                                    fromChain?.vmType === 'evm' &&
                                    publicClient &&
                                    fromBalance
                                  ) {
                                    getFeeBufferAmount(
                                      fromChain.vmType,
                                      fromChain.id,
                                      fromBalance,
                                      publicClient
                                    )
                                  } else if (
                                    fromChain?.vmType === 'svm' &&
                                    fromChain.id
                                  ) {
                                    getFeeBufferAmount(
                                      fromChain.vmType,
                                      fromChain.id,
                                      0n,
                                      null
                                    )
                                  }
                                }}
                                onClick={async () => {
                                  if (!fromBalance || !fromToken || !fromChain)
                                    return

                                  let feeBufferAmount: bigint = 0n
                                  if (isFromNative) {
                                    feeBufferAmount = await getFeeBufferAmount(
                                      fromChain.vmType,
                                      fromChain.id,
                                      fromBalance,
                                      publicClient ?? null
                                    )
                                  }

                                  const finalMaxAmount =
                                    isFromNative && feeBufferAmount > 0n
                                      ? fromBalance > feeBufferAmount
                                        ? fromBalance - feeBufferAmount
                                        : 0n
                                      : fromBalance

                                  handleMaxAmountClicked(
                                    finalMaxAmount,
                                    'max',
                                    isFromNative ? feeBufferAmount : 0n
                                  )
                                }}
                              >
                                MAX
                              </Button>
                            </Flex>
                          ) : null}
                        </Flex>
                      </Flex>
                    </TokenSelectorContainer>
                    <Box
                      css={{
                        position: 'relative',
                        my: -13,
                        mx: 'auto',
                        height: 32,
                        width: 32
                      }}
                    >
                      {hasLockedToken ||
                      ((isSvmSwap || isBvmSwap) &&
                        !multiWalletSupportEnabled) ? null : (
                        <Button
                          size="none"
                          color="white"
                          css={{
                            mt: '4px',
                            color: 'gray9',
                            alignSelf: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            '--borderWidth':
                              'borders.widget-swap-currency-button-border-width',
                            '--borderColor':
                              'colors.widget-swap-currency-button-border-color',
                            border: `var(--borderWidth) solid var(--borderColor)`,
                            zIndex: 10,
                            borderRadius:
                              'widget-swap-currency-button-border-radius'
                          }}
                          onClick={() => {
                            if (fromToken || toToken) {
                              if (tradeType === 'EXACT_INPUT') {
                                setTradeType('EXPECTED_OUTPUT')
                                setAmountInputValue('')
                                setAmountOutputValue(amountInputValue)
                              } else {
                                setTradeType('EXACT_INPUT')
                                setAmountOutputValue('')
                                setAmountInputValue(amountOutputValue)
                              }

                              handleSetFromToken(toToken)
                              handleSetToToken(fromToken)
                              debouncedAmountInputControls.flush()
                              debouncedAmountOutputControls.flush()
                            }
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faArrowDown}
                            width={16}
                            height={16}
                          />
                        </Button>
                      )}
                    </Box>
                    <TokenSelectorContainer
                      css={{
                        backgroundColor: 'widget-background',
                        mb: 'widget-card-section-gutter'
                      }}
                      id={'to-token-section'}
                    >
                      <Flex
                        css={{ width: '100%' }}
                        align="center"
                        justify="between"
                      >
                        <Text style="subtitle2" color="subtle">
                          Buy
                        </Text>

                        {multiWalletSupportEnabled &&
                        toChainWalletVMSupported ? (
                          <MultiWalletDropdown
                            context="destination"
                            disablePasteWalletAddressOption={
                              disablePasteWalletAddressOption
                            }
                            selectedWalletAddress={recipient}
                            onSelect={(wallet) => {
                              setCustomToAddress(wallet.address)
                            }}
                            chain={toChain}
                            onLinkNewWallet={() => {
                              if (!address && toChainWalletVMSupported) {
                                onConnectWallet?.()
                              } else {
                                onLinkNewWallet?.({
                                  chain: toChain,
                                  direction: 'to'
                                })?.then((wallet) => {
                                  setCustomToAddress(wallet.address)
                                })
                              }
                            }}
                            setAddressModalOpen={setAddressModalOpen}
                            wallets={linkedWallets!}
                            onAnalyticEvent={onAnalyticEvent}
                          />
                        ) : null}

                        {!multiWalletSupportEnabled ||
                        !toChainWalletVMSupported ? (
                          <Button
                            color={
                              isValidToAddress &&
                              multiWalletSupportEnabled &&
                              !isRecipientLinked
                                ? 'warning'
                                : 'secondary'
                            }
                            corners="pill"
                            size="none"
                            css={{
                              display: 'flex',
                              alignItems: 'center',
                              px: '2',
                              py: '1'
                            }}
                            onClick={() => {
                              setAddressModalOpen(true)
                              onAnalyticEvent?.(
                                EventNames.SWAP_ADDRESS_MODAL_CLICKED
                              )
                            }}
                          >
                            {isValidToAddress &&
                            multiWalletSupportEnabled &&
                            !isRecipientLinked ? (
                              <Box css={{ color: 'amber11' }}>
                                <FontAwesomeIcon
                                  icon={faClipboard}
                                  width={16}
                                  height={16}
                                />
                              </Box>
                            ) : null}
                            <Text
                              style="subtitle2"
                              css={{
                                color:
                                  isValidToAddress &&
                                  multiWalletSupportEnabled &&
                                  !isRecipientLinked
                                    ? 'amber11'
                                    : 'anchor-color'
                              }}
                            >
                              {!isValidToAddress
                                ? `Enter Address`
                                : toDisplayName}
                            </Text>
                          </Button>
                        ) : null}
                      </Flex>

                      <Flex
                        align="center"
                        justify="between"
                        css={{ gap: '4', width: '100%' }}
                      >
                        <AmountInput
                          value={
                            tradeType === 'EXPECTED_OUTPUT'
                              ? amountOutputValue
                              : amountOutputValue
                                ? formatFixedLength(amountOutputValue, 8)
                                : amountOutputValue
                          }
                          setValue={(e) => {
                            setAmountOutputValue(e)
                            setTradeType('EXPECTED_OUTPUT')
                            if (Number(e) === 0) {
                              setAmountInputValue('')
                              debouncedAmountOutputControls.flush()
                            }
                          }}
                          disabled={!toToken || !fromChainWalletVMSupported}
                          onFocus={() => {
                            onAnalyticEvent?.(EventNames.SWAP_OUTPUT_FOCUSED)
                          }}
                          css={{
                            fontWeight: '700',
                            fontSize: 32,
                            color:
                              isFetchingQuote && tradeType === 'EXACT_INPUT'
                                ? 'text-subtle'
                                : 'input-color',
                            _placeholder: {
                              color:
                                isFetchingQuote && tradeType === 'EXACT_INPUT'
                                  ? 'text-subtle'
                                  : 'input-color'
                            },
                            _disabled: {
                              cursor: 'not-allowed',
                              _placeholder: {
                                color: 'gray10'
                              },
                              color: 'gray10'
                            }
                          }}
                        />
                        <TokenSelector
                          address={recipient}
                          isValidAddress={isValidToAddress}
                          token={toToken}
                          fromChainWalletVMSupported={
                            fromChainWalletVMSupported
                          }
                          supportedWalletVMs={supportedWalletVMs}
                          setToken={(token) => {
                            if (
                              token.address === fromToken?.address &&
                              token.chainId === fromToken?.chainId &&
                              address === recipient &&
                              (!lockToToken || !fromToken)
                            ) {
                              handleSetToToken(fromToken)
                              handleSetFromToken(toToken)
                            } else {
                              handleSetToToken(token)
                            }
                          }}
                          context="to"
                          multiWalletSupportEnabled={multiWalletSupportEnabled}
                          trigger={
                            <div style={{ width: 'max-content' }}>
                              <TokenTrigger
                                token={toToken}
                                locked={lockToToken}
                                isSingleChainLocked={isSingleChainLocked}
                                address={address}
                              />
                            </div>
                          }
                          onAnalyticEvent={onAnalyticEvent}
                          lockedChainIds={
                            isSingleChainLocked
                              ? [lockChainId]
                              : isChainLocked(
                                    toToken?.chainId,
                                    lockChainId,
                                    fromToken?.chainId,
                                    lockToToken
                                  ) && toToken?.chainId
                                ? [toToken.chainId]
                                : undefined
                          }
                          chainIdsFilter={
                            !fromChainWalletVMSupported && fromToken
                              ? [fromToken.chainId]
                              : undefined
                          }
                          popularChainIds={popularChainIds}
                        />
                      </Flex>
                      <Flex
                        align="center"
                        justify="between"
                        css={{ gap: '3', width: '100%' }}
                      >
                        {toToken ? (
                          <Flex
                            align="center"
                            css={{
                              gap: '1',
                              minHeight: 18
                            }}
                          >
                            <Text style="subtitle3" color="subtleSecondary">
                              {quote?.details?.currencyOut?.amountUsd &&
                              !isFetchingQuote ? (
                                formatDollar(
                                  Number(quote.details.currencyOut.amountUsd)
                                )
                              ) : isLoadingToTokenPrice &&
                                amountOutputValue &&
                                Number(amountOutputValue) > 0 ? (
                                <Box
                                  css={{
                                    width: 45,
                                    height: 12,
                                    backgroundColor: 'gray7',
                                    borderRadius: 'widget-border-radius'
                                  }}
                                />
                              ) : outputAmountUsd &&
                                outputAmountUsd > 0 &&
                                toTokenPriceData?.price &&
                                toTokenPriceData.price > 0 ? (
                                formatDollar(outputAmountUsd)
                              ) : null}
                            </Text>
                            {quote?.details?.currencyOut?.amountUsd &&
                            quote?.details?.currencyOut?.amountUsd != '0' &&
                            !isFetchingQuote &&
                            quote.details.totalImpact?.percent ? (
                              <Text
                                style="subtitle3"
                                color={feeBreakdown?.totalFees.priceImpactColor}
                              >
                                ({feeBreakdown?.totalFees.priceImpactPercentage}
                                )
                              </Text>
                            ) : null}
                          </Flex>
                        ) : (
                          <Flex css={{ height: 18 }} />
                        )}
                        <Flex css={{ marginLeft: 'auto' }}>
                          {toToken ? (
                            <BalanceDisplay
                              isLoading={isLoadingToBalance}
                              balance={toBalance}
                              decimals={toToken?.decimals}
                              symbol={toToken?.symbol}
                              displaySymbol={false}
                              isConnected={
                                address !== evmDeadAddress &&
                                address !== solDeadAddress &&
                                address !== undefined
                              }
                              pending={toBalancePending}
                            />
                          ) : (
                            <Flex css={{ height: 18 }} />
                          )}
                        </Flex>
                      </Flex>
                    </TokenSelectorContainer>
                    {error &&
                    !isFetchingQuote &&
                    !isSingleChainLocked &&
                    fromChainWalletVMSupported ? (
                      <Box
                        css={{
                          borderRadius: 'widget-card-border-radius',
                          backgroundColor: 'widget-background',
                          border: 'widget-card-border',
                          overflow: 'hidden',
                          mb: 'widget-card-section-gutter'
                        }}
                        id={'swap-route-selection-section'}
                      >
                        <SwapRouteSelector
                          chain={toChain}
                          supportsExternalLiquidity={supportsExternalLiquidity}
                          externalLiquidtySelected={useExternalLiquidity}
                          canonicalTimeEstimate={
                            canonicalTimeEstimate?.formattedTime
                          }
                          onExternalLiquidityChange={(selected) => {
                            setUseExternalLiquidity(selected)
                          }}
                        />
                      </Box>
                    ) : null}
                    <GasTopUpSection
                      toChain={toChain}
                      gasTopUpEnabled={gasTopUpEnabled}
                      onGasTopUpEnabled={(enabled) => {
                        setGasTopUpEnabled(enabled)
                        onAnalyticEvent?.(EventNames.GAS_TOP_UP_TOGGLE, {
                          enabled,
                          amount: gasTopUpAmount,
                          amount_usd: gasTopUpAmountUsd,
                          quote
                        })
                      }}
                      gasTopUpRequired={gasTopUpRequired}
                      gasTopUpAmount={gasTopUpAmount}
                      gasTopUpAmountUsd={gasTopUpAmountUsd}
                    />
                    <FeeBreakdown
                      feeBreakdown={feeBreakdown}
                      isFetchingQuote={isFetchingQuote}
                      toToken={toToken}
                      fromToken={fromToken}
                      quote={quote}
                      timeEstimate={timeEstimate}
                      supportsExternalLiquidity={supportsExternalLiquidity}
                      useExternalLiquidity={useExternalLiquidity}
                      isAutoSlippage={isAutoSlippage}
                      toChain={toChain}
                      setUseExternalLiquidity={(enabled) => {
                        setUseExternalLiquidity(enabled)
                        onAnalyticEvent?.(EventNames.SWAP_ROUTE_SELECTED, {
                          route: enabled ? 'canonical' : 'relay'
                        })
                      }}
                      canonicalTimeEstimate={canonicalTimeEstimate}
                      isSingleChainLocked={isSingleChainLocked}
                      fromChainWalletVMSupported={fromChainWalletVMSupported}
                    />
                    <WidgetErrorWell
                      hasInsufficientBalance={hasInsufficientBalance}
                      error={error}
                      quote={quote}
                      currency={fromToken}
                      isHighRelayerServiceFee={highRelayerServiceFee}
                      isCapacityExceededError={isCapacityExceededError}
                      isCouldNotExecuteError={isCouldNotExecuteError}
                      relayerFeeProportion={relayerFeeProportion}
                      supportsExternalLiquidity={supportsExternalLiquidity}
                      containerCss={{
                        mb: 'widget-card-section-gutter'
                      }}
                      recipientWalletSupportsChain={
                        recipientWalletSupportsChain
                      }
                    />
                    {promptSwitchRoute ? (
                      <Button
                        color="primary"
                        css={{ flexGrow: '1', justifyContent: 'center' }}
                        onClick={() => {
                          setUseExternalLiquidity(true)
                          onAnalyticEvent?.(EventNames.CTA_SWITCH_ROUTE_CLICKED)
                        }}
                      >
                        Switch Route
                      </Button>
                    ) : (
                      <SwapButton
                        isFetchingQuote={isFetchingQuote}
                        transactionModalOpen={transactionModalOpen}
                        depositAddressModalOpen={depositAddressModalOpen}
                        isValidFromAddress={isValidFromAddress}
                        isValidToAddress={isValidToAddress}
                        fromChainWalletVMSupported={fromChainWalletVMSupported}
                        context={'Swap'}
                        showHighPriceImpactWarning={showHighPriceImpactWarning}
                        onConnectWallet={onConnectWallet}
                        onAnalyticEvent={onAnalyticEvent}
                        quote={quote}
                        address={address}
                        hasInsufficientBalance={hasInsufficientBalance}
                        isInsufficientLiquidityError={
                          isInsufficientLiquidityError
                        }
                        recipientWalletSupportsChain={
                          recipientWalletSupportsChain
                        }
                        debouncedInputAmountValue={debouncedInputAmountValue}
                        debouncedOutputAmountValue={debouncedOutputAmountValue}
                        isSameCurrencySameRecipientSwap={
                          isSameCurrencySameRecipientSwap
                        }
                        onClick={() => {
                          if (fromChainWalletVMSupported) {
                            if (!isValidToAddress || !isValidFromAddress) {
                              if (
                                multiWalletSupportEnabled &&
                                (isValidToAddress ||
                                  (!isValidToAddress &&
                                    toChainWalletVMSupported))
                              ) {
                                const chain = !isValidFromAddress
                                  ? fromChain
                                  : toChain
                                if (!address) {
                                  onConnectWallet?.()
                                } else {
                                  onLinkNewWallet?.({
                                    chain: chain,
                                    direction: !isValidFromAddress
                                      ? 'from'
                                      : 'to'
                                  })?.then((wallet) => {
                                    if (!isValidFromAddress) {
                                      onSetPrimaryWallet?.(wallet.address)
                                    } else {
                                      setCustomToAddress(wallet.address)
                                    }
                                  })
                                }
                              } else {
                                setAddressModalOpen(true)
                              }
                            } else {
                              swap()
                            }
                          } else {
                            if (!isValidToAddress) {
                              if (
                                multiWalletSupportEnabled &&
                                toChainWalletVMSupported
                              ) {
                                if (!address) {
                                  onConnectWallet?.()
                                } else {
                                  onLinkNewWallet?.({
                                    chain: toChain,
                                    direction: 'to'
                                  })?.then((wallet) => {
                                    setCustomToAddress(wallet.address)
                                  })
                                }
                              } else {
                                setAddressModalOpen(true)
                              }
                            } else {
                              const swapEventData = getSwapEventData(
                                quote?.details,
                                quote?.steps
                                  ? (quote?.steps as Execute['steps'])
                                  : null,
                                linkedWallet?.connector,
                                quoteParameters
                              )
                              onAnalyticEvent?.(
                                EventNames.SWAP_CTA_CLICKED,
                                swapEventData
                              )
                              setDepositAddressModalOpen(true)
                            }
                          }
                        }}
                        ctaCopy={ctaCopy}
                      />
                    )}
                  </Flex>
                  <UnverifiedTokenModal
                    open={unverifiedTokens.length > 0}
                    onOpenChange={() => {}}
                    data={
                      unverifiedTokens.length > 0
                        ? unverifiedTokens[0]
                        : undefined
                    }
                    onDecline={(token, context) => {
                      const tokens = unverifiedTokens.filter(
                        (unverifiedToken) =>
                          !(
                            unverifiedToken.context === context &&
                            unverifiedToken.token.address === token?.address &&
                            unverifiedToken.token.chainId === token?.chainId
                          )
                      )
                      setUnverifiedTokens(tokens)
                    }}
                    onAcceptToken={(token, context) => {
                      if (token) {
                        if (context === 'to') {
                          onAnalyticEvent?.(EventNames.SWAP_TOKEN_SELECT, {
                            direction: 'output',
                            token_symbol: token.symbol
                          })
                          if (
                            token.address === fromToken?.address &&
                            token.chainId === fromToken?.chainId &&
                            address === recipient &&
                            (!lockToToken || !fromToken)
                          ) {
                            handleSetToToken(fromToken)
                            handleSetFromToken(toToken)
                          } else {
                            handleSetToToken(token)
                          }
                        } else if (context === 'from') {
                          onAnalyticEvent?.(EventNames.SWAP_TOKEN_SELECT, {
                            direction: 'input',
                            token_symbol: token.symbol
                          })
                          if (
                            token.address === toToken?.address &&
                            token.chainId === toToken?.chainId &&
                            address === recipient &&
                            (!lockToToken || !fromToken)
                          ) {
                            handleSetFromToken(toToken)
                            handleSetToToken(fromToken)
                          } else {
                            handleSetFromToken(token)
                          }
                        }
                      }
                      const tokens = unverifiedTokens.filter(
                        (unverifiedToken) =>
                          !(
                            unverifiedToken.token.address === token?.address &&
                            unverifiedToken.token.chainId === token?.chainId
                          )
                      )
                      setUnverifiedTokens(tokens)
                    }}
                  />
                </>
              )
            }}
          </WidgetContainer>
        )
      }}
    </SwapWidgetRenderer>
  )
}

export default SwapWidget
