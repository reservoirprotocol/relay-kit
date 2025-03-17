import { Flex, Button, Text, Box } from '../../primitives/index.js'
import { useContext, useEffect, useState, type FC } from 'react'
import { useRelayClient } from '../../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import type { LinkedWallet, Token } from '../../../types/index.js'
import { AnchorButton } from '../../primitives/Anchor.js'
import { formatFixedLength, formatDollar } from '../../../utils/numbers.js'
import AmountInput from '../../common/AmountInput.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown'
import type { ChainVM, Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { WidgetErrorWell } from '../WidgetErrorWell.js'
import { BalanceDisplay } from '../../common/BalanceDisplay.js'
import { EventNames } from '../../../constants/events.js'
import SwapWidgetRenderer from '../SwapWidgetRenderer.js'
import WidgetContainer from '../WidgetContainer.js'
import SwapButton from '../SwapButton.js'
import TokenSelectorContainer from '../TokenSelectorContainer.js'
import FeeBreakdown from '../FeeBreakdown.js'
import {
  faClipboard,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons'
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

type BaseSwapWidgetProps = {
  defaultFromToken?: Token
  defaultToToken?: Token
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: 'EXACT_INPUT' | 'EXPECTED_OUTPUT'
  slippageTolerance?: string
  lockToToken?: boolean
  lockFromToken?: boolean
  lockChainId?: number
  singleChainMode?: boolean
  wallet?: AdaptedWallet
  supportedWalletVMs: ChainVM[]
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
  defaultFromToken,
  defaultToToken,
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
  onSetPrimaryWallet,
  onLinkNewWallet,
  onFromTokenChange,
  onToTokenChange,
  onConnectWallet,
  onAnalyticEvent,
  onSwapSuccess,
  onSwapValidating,
  onSwapError
}) => {
  const relayClient = useRelayClient()
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const connectorKeyOverrides = providerOptionsContext.vmConnectorKeyOverrides
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [depositAddressModalOpen, setDepositAddressModalOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [unverifiedTokenModalOpen, setUnverifiedTokenModalOpen] =
    useState(false)
  const [unverifiedTokens, setUnverifiedTokens] = useState<Token[]>([])
  const hasLockedToken = lockFromToken || lockToToken
  const isSingleChainLocked = singleChainMode && lockChainId !== undefined

  useEffect(() => {
    if (
      defaultFromToken &&
      'verified' in defaultFromToken &&
      !defaultFromToken.verified
    ) {
      const isAlreadyAccepted = alreadyAcceptedToken(defaultFromToken)
      if (!isAlreadyAccepted) {
        unverifiedTokens.push(defaultFromToken)
      }
    }
    if (
      defaultToToken &&
      'verified' in defaultToToken &&
      !defaultToToken.verified
    ) {
      const isAlreadyAccepted = alreadyAcceptedToken(defaultToToken)
      if (!isAlreadyAccepted) {
        unverifiedTokens.push(defaultToToken)
      }
    }
    if (unverifiedTokens.length > 0) {
      setUnverifiedTokenModalOpen(true)
    }
  }, [])

  return (
    <SwapWidgetRenderer
      context="Swap"
      transactionModalOpen={transactionModalOpen}
      setTransactionModalOpen={setTransactionModalOpen}
      depositAddressModalOpen={depositAddressModalOpen}
      defaultAmount={defaultAmount}
      defaultToAddress={defaultToAddress}
      defaultTradeType={defaultTradeType}
      defaultFromToken={defaultFromToken}
      defaultToToken={defaultToToken}
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
        setSwapError,
        setUseExternalLiquidity,
        invalidateBalanceQueries,
        invalidateQuoteQuery
      }) => {
        const handleSetFromToken = (token?: Token) => {
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
        }, [
          multiWalletSupportEnabled,
          fromChain,
          address,
          linkedWallets,
          onSetPrimaryWallet,
          isValidFromAddress,
          connectorKeyOverrides
        ])

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
            quote={quote}
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
                setSwapError(null)
                setSteps(null)
              }
            }}
            onDepositAddressModalOpenChange={(open) => {
              if (!open) {
                setSwapError(null)
              }
            }}
            useExternalLiquidity={useExternalLiquidity}
            slippageTolerance={slippageTolerance}
            swapError={swapError}
            setSwapError={setSwapError}
            onSwapSuccess={(data) => {
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
                          depositAddressOnly={!fromChainWalletVMSupported}
                          restrictedToken={toToken}
                          setToken={(token) => {
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
                          trigger={
                            <div style={{ width: 'max-content' }}>
                              <TokenTrigger
                                token={fromToken}
                                locked={lockFromToken}
                                isSingleChainLocked={isSingleChainLocked}
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
                        {quote?.details?.currencyIn?.amountUsd &&
                        Number(quote.details.currencyIn.amountUsd) > 0 ? (
                          <Text style="subtitle3" color="subtleSecondary">
                            {formatDollar(
                              Number(quote.details.currencyIn.amountUsd)
                            )}
                          </Text>
                        ) : null}
                        <Flex
                          align="center"
                          css={{ gap: '3', marginLeft: 'auto' }}
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
                          (fromChain?.vmType === 'evm' ||
                            (isFromNative &&
                              fromBalance >
                                BigInt(
                                  0.02 * 10 ** (fromToken?.decimals ?? 18)
                                ))) ? (
                            <AnchorButton
                              aria-label="MAX"
                              css={{ fontSize: 12 }}
                              onClick={() => {
                                const percentageBuffer =
                                  (fromBalance * 1n) / 100n // 1% of the balance
                                const fixedBuffer = BigInt(
                                  0.02 * 10 ** (fromToken?.decimals ?? 18)
                                ) // Fixed buffer of 0.02 tokens
                                const solanaBuffer =
                                  percentageBuffer > fixedBuffer
                                    ? percentageBuffer
                                    : fixedBuffer

                                if (fromToken) {
                                  setAmountInputValue(
                                    formatUnits(
                                      isFromNative
                                        ? fromChain?.vmType === 'svm'
                                          ? fromBalance - solanaBuffer
                                          : fromBalance - percentageBuffer
                                        : fromBalance,
                                      fromToken?.decimals
                                    )
                                  )
                                  setTradeType('EXACT_INPUT')
                                  debouncedAmountOutputControls.cancel()
                                  debouncedAmountInputControls.flush()
                                  onAnalyticEvent?.(
                                    EventNames.MAX_AMOUNT_CLICKED
                                  )
                                }
                              }}
                            >
                              MAX
                            </AnchorButton>
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
                            selectedWalletAddress={recipient}
                            onSelect={(wallet) =>
                              setCustomToAddress(wallet.address)
                            }
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
                                    : 'secondary-button-color'
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
                          depositAddressOnly={!fromChainWalletVMSupported}
                          restrictedToken={fromToken}
                          setToken={(token) => {
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
                          }}
                          context="to"
                          multiWalletSupportEnabled={multiWalletSupportEnabled}
                          trigger={
                            <div style={{ width: 'max-content' }}>
                              <TokenTrigger
                                token={toToken}
                                locked={lockToToken}
                                isSingleChainLocked={isSingleChainLocked}
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
                        />
                      </Flex>
                      <Flex
                        align="center"
                        justify="between"
                        css={{ gap: '3', width: '100%' }}
                      >
                        {quote?.details?.currencyOut?.amountUsd &&
                        Number(quote.details.currencyOut.amountUsd) > 0 ? (
                          <Flex align="center" css={{ gap: '1' }}>
                            <Text style="subtitle3" color="subtleSecondary">
                              {formatDollar(
                                Number(quote.details.currencyOut.amountUsd)
                              )}
                            </Text>
                            <Text
                              style="subtitle3"
                              color={feeBreakdown?.totalFees.priceImpactColor}
                              css={{
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              ({feeBreakdown?.totalFees.priceImpactPercentage})
                            </Text>
                          </Flex>
                        ) : null}
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
                            // If either address is not valid, open the link wallet modal
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
                              setDepositAddressModalOpen(true)
                            }
                          }
                        }}
                        ctaCopy={ctaCopy}
                      />
                    )}
                  </Flex>
                  <UnverifiedTokenModal
                    open={unverifiedTokenModalOpen}
                    onOpenChange={setUnverifiedTokenModalOpen}
                    token={
                      unverifiedTokens.length > 0
                        ? unverifiedTokens[0]
                        : undefined
                    }
                    onAcceptToken={(token) => {
                      if (token) {
                        if (
                          defaultToToken &&
                          defaultToToken?.address === token.address &&
                          defaultToToken.chainId === token.chainId
                        ) {
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
                        } else if (
                          defaultFromToken &&
                          defaultFromToken?.address === token.address &&
                          defaultFromToken.chainId === token.chainId
                        ) {
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
                            unverifiedToken.address === token?.address &&
                            unverifiedToken.chainId === token?.chainId
                          )
                      )
                      setUnverifiedTokens(tokens)
                      if (tokens.length > 0) {
                        setUnverifiedTokenModalOpen(true)
                      } else {
                        setUnverifiedTokenModalOpen(false)
                      }
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
