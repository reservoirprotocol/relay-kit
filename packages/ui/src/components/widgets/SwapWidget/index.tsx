import { Flex, Button, Text, Box } from '../../primitives/index.js'
import { useState, type FC } from 'react'
import { useMounted, useRelayClient } from '../../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits, zeroAddress } from 'viem'
import TokenSelector from '../../common/TokenSelector/TokenSelector.js'
import type { Token } from '../../../types/index.js'
import { AnchorButton } from '../../primitives/Anchor.js'
import { formatFixedLength, formatDollar } from '../../../utils/numbers.js'
import AmountInput from '../../common/AmountInput.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle'
import type { ChainVM, Execute } from '@reservoir0x/relay-sdk'
import { WidgetErrorWell } from '../WidgetErrorWell.js'
import { BalanceDisplay } from '../../common/BalanceDisplay.js'
import { EventNames } from '../../../constants/events.js'
import SwapWidgetRenderer from '../SwapWidgetRenderer.js'
import WidgetContainer from '../WidgetContainer.js'
import SwapButton from '../SwapButton.js'
import TokenSelectorContainer from '../TokenSelectorContainer.js'
import FetchingQuoteLoader from '../FetchingQuoteLoader.js'
import FeeBreakdown from '../FeeBreakdown.js'
import { mainnet } from 'viem/chains'
import { PriceImpactTooltip } from '../PriceImpactTooltip.js'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { truncateAddress } from '../../../utils/truncate.js'
import { SwapWidgetTokenTrigger } from '../../common/TokenSelector/triggers/SwapWidgetTokenTrigger.js'
import { ChainTrigger } from '../../common/TokenSelector/triggers/ChainTrigger.js'
import { MultiWalletDropdown } from '../../common/MultiWalletDropdown.js'

export type LinkedWallet = {
  address: string
  vmType: ChainVM
  walletLogoUrl?: string
}

type BaseSwapWidgetProps = {
  defaultFromToken?: Token
  defaultToToken?: Token
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  lockToToken?: boolean
  lockFromToken?: boolean
  onFromTokenChange?: (token?: Token) => void
  onToTokenChange?: (token?: Token) => void
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
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
  onLinkNewWallet: () => void
}

export type SwapWidgetProps = MultiWalletDisabledProps | MultiWalletEnabledProps

const SwapWidget: FC<SwapWidgetProps> = ({
  defaultFromToken,
  defaultToToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  lockToToken = false,
  lockFromToken = false,
  multiWalletSupportEnabled = false,
  linkedWallets,
  onSetPrimaryWallet,
  onLinkNewWallet,
  onFromTokenChange,
  onToTokenChange,
  onConnectWallet,
  onAnalyticEvent,
  onSwapSuccess,
  onSwapError
}) => {
  const relayClient = useRelayClient()
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const isMounted = useMounted()
  const hasLockedToken = lockFromToken || lockToToken
  const defaultChainId = relayClient?.chains[0].id ?? mainnet.id
  const initialFromToken = defaultFromToken ?? {
    chainId: defaultChainId,
    address: zeroAddress,
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://assets.relay.link/icons/1/light.png'
  }

  return (
    <SwapWidgetRenderer
      context="Swap"
      transactionModalOpen={transactionModalOpen}
      defaultAmount={defaultAmount}
      defaultToAddress={defaultToAddress}
      defaultTradeType={defaultTradeType}
      defaultFromToken={initialFromToken}
      defaultToToken={defaultToToken}
      onSwapError={onSwapError}
      onAnalyticEvent={onAnalyticEvent}
    >
      {({
        price,
        feeBreakdown,
        fromToken,
        setFromToken,
        toToken,
        setToToken,
        swapError,
        error,
        toDisplayName,
        address,
        recipient,
        customToAddress,
        setCustomToAddress,
        tradeType,
        setTradeType,
        details,
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
        isLoadingToBalance,
        isFetchingPrice,
        isLoadingFromBalance,
        fromBalance,
        highRelayerServiceFee,
        relayerFeeProportion,
        hasInsufficientBalance,
        isInsufficientLiquidityError,
        ctaCopy,
        isFromETH,
        timeEstimate,
        isSvmSwap,
        isValidSolanaRecipient,
        setDetails,
        setSwapError,
        invalidateBalanceQueries
      }) => {
        const handleSetFromToken = (token?: Token) => {
          setFromToken(token)
          onFromTokenChange?.(token)
        }
        const handleSetToToken = (token?: Token) => {
          const toChain = relayClient?.chains?.find(
            (chain) => chain.id === toToken?.chainId
          )
          if (toChain?.vmType !== 'svm' && isValidSolanaRecipient) {
            setCustomToAddress(address ?? undefined)
          }
          setToToken(token)
          onToTokenChange?.(token)
        }

        const fromChain = relayClient?.chains?.find(
          (chain) => chain.id === fromToken?.chainId
        )

        const toChain = relayClient?.chains?.find(
          (chain) => chain.id === toToken?.chainId
        )

        const fromTokenSelectorOpenState = useState(false)
        const [fromTokenSelectorType, setFromTokenSelectorType] = useState<
          'token' | 'chain'
        >('token')

        const toTokenSelectorOpenState = useState(false)
        const [toTokenSelectorType, setToTokenSelectorType] = useState<
          'token' | 'chain'
        >('token')

        return (
          <WidgetContainer
            transactionModalOpen={transactionModalOpen}
            setTransactionModalOpen={setTransactionModalOpen}
            addressModalOpen={addressModalOpen}
            setAddressModalOpen={setAddressModalOpen}
            isSvmSwap={isSvmSwap}
            fromToken={fromToken}
            toToken={toToken}
            toChain={toChain}
            swapError={swapError}
            price={price}
            address={address}
            recipient={recipient}
            amountInputValue={amountInputValue}
            amountOutputValue={amountOutputValue}
            debouncedInputAmountValue={debouncedInputAmountValue}
            debouncedOutputAmountValue={debouncedOutputAmountValue}
            tradeType={tradeType}
            onSwapModalOpenChange={(open) => {
              if (!open) {
                setSwapError(null)
              }
            }}
            useExternalLiquidity={false}
            onSwapSuccess={onSwapSuccess}
            onAnalyticEvent={onAnalyticEvent}
            invalidateBalanceQueries={invalidateBalanceQueries}
            customToAddress={customToAddress}
            setCustomToAddress={setCustomToAddress}
            timeEstimate={timeEstimate}
          >
            {() => {
              return (
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
                  >
                    <Flex
                      align="center"
                      justify="between"
                      css={{ gap: '2', width: '100%' }}
                    >
                      <Text style="subtitle2" color="subtle">
                        From
                      </Text>

                      {multiWalletSupportEnabled === true && address ? (
                        <MultiWalletDropdown
                          context="origin"
                          selectedWalletAddress={address} // @TODO: update to use AdaptedWallet
                          onSelect={(wallet) =>
                            onSetPrimaryWallet?.(wallet.address)
                          }
                          onLinkNewWallet={onLinkNewWallet!}
                          setAddressModalOpen={setAddressModalOpen}
                          wallets={linkedWallets!}
                        />
                      ) : null}
                    </Flex>
                    <ChainTrigger
                      token={fromToken}
                      chain={fromChain}
                      onClick={() => {
                        setFromTokenSelectorType('chain')
                        fromTokenSelectorOpenState[1](
                          !fromTokenSelectorOpenState[0]
                        )
                        onAnalyticEvent?.(EventNames.SWAP_START_TOKEN_SELECT, {
                          type: 'chain',
                          direction: 'input'
                        })
                      }}
                    />
                    <Flex align="center" justify="between" css={{ gap: '4' }}>
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
                          fontSize: 28,
                          lineHeight: '36px',
                          py: 0,
                          color:
                            isFetchingPrice && tradeType === 'EXACT_OUTPUT'
                              ? 'text-subtle'
                              : 'input-color',
                          _placeholder: {
                            color:
                              isFetchingPrice && tradeType === 'EXACT_OUTPUT'
                                ? 'text-subtle'
                                : 'input-color'
                          }
                        }}
                      />
                      <TokenSelector
                        openState={fromTokenSelectorOpenState}
                        type={fromTokenSelectorType}
                        token={fromToken}
                        onAnalyticEvent={onAnalyticEvent}
                        setToken={(token) => {
                          onAnalyticEvent?.(EventNames.SWAP_TOKEN_SELECT, {
                            direction: 'input',
                            token_symbol: token.symbol
                          })
                          if (
                            token.address === toToken?.address &&
                            token.chainId === toToken?.chainId &&
                            address === recipient
                          ) {
                            handleSetFromToken(toToken)
                            handleSetToToken(fromToken)
                          } else {
                            handleSetFromToken(token)
                          }
                        }}
                        context="from"
                        size={
                          fromTokenSelectorType === 'chain'
                            ? 'mobile'
                            : 'desktop'
                        }
                        trigger={
                          <div
                            style={{ width: 'max-content' }}
                            onClick={() => setFromTokenSelectorType('token')}
                          >
                            <SwapWidgetTokenTrigger
                              token={fromToken}
                              locked={lockFromToken}
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
                      {price?.details?.currencyIn?.amountUsd &&
                      Number(price.details.currencyIn.amountUsd) > 0 ? (
                        <Text style="subtitle3" color="subtle">
                          {formatDollar(
                            Number(price.details.currencyIn.amountUsd)
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
                          />
                        ) : (
                          <Flex css={{ height: 18 }} />
                        )}
                        {fromBalance ? (
                          <AnchorButton
                            aria-label="MAX"
                            css={{ fontSize: 12 }}
                            onClick={() => {
                              if (fromToken) {
                                setAmountInputValue(
                                  formatUnits(
                                    isFromETH
                                      ? (fromBalance * 99n) / 100n
                                      : fromBalance,
                                    fromToken?.decimals
                                  )
                                )
                                setTradeType('EXACT_INPUT')
                                debouncedAmountOutputControls.cancel()
                                debouncedAmountInputControls.flush()
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
                      my: -15,
                      mx: 'auto',
                      height: 36,
                      width: 36
                    }}
                  >
                    {hasLockedToken || isSvmSwap ? null : (
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
                          '--borderColor':
                            'colors.widget-swap-currency-button-border-color',
                          border: '4px solid var(--borderColor)',
                          zIndex: 10
                        }}
                        onClick={() => {
                          if (fromToken || toToken) {
                            if (tradeType === 'EXACT_INPUT') {
                              setTradeType('EXACT_OUTPUT')
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
                    css={{ backgroundColor: 'widget-background', mb: '6px' }}
                  >
                    <Flex
                      css={{ width: '100%' }}
                      align="center"
                      justify="between"
                    >
                      <Text style="subtitle2" color="subtle">
                        To
                      </Text>

                      {multiWalletSupportEnabled === true && recipient ? (
                        <MultiWalletDropdown
                          context="destination"
                          selectedWalletAddress={recipient}
                          onSelect={(wallet) =>
                            setCustomToAddress(wallet.address)
                          }
                          onLinkNewWallet={onLinkNewWallet!}
                          setAddressModalOpen={setAddressModalOpen}
                          wallets={linkedWallets!}
                        />
                      ) : null}

                      {/* {isMounted && (address || customToAddress) ? (
                        <AnchorButton
                          css={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2'
                          }}
                          onClick={() => {
                            setAddressModalOpen(true)
                            onAnalyticEvent?.(
                              EventNames.SWAP_ADDRESS_MODAL_CLICKED
                            )
                          }}
                        >
                          <Text style="subtitle2" css={{ color: 'inherit' }}>
                            {isSvmSwap && !isValidSolanaRecipient
                              ? `Enter ${toChain?.displayName} Address`
                              : toDisplayName}
                          </Text>
                          <Box css={{ color: 'gray8' }}>
                            <FontAwesomeIcon
                              icon={faPenToSquare}
                              width={16}
                              height={16}
                            />
                          </Box>
                        </AnchorButton>
                      ) : null} */}
                    </Flex>
                    <ChainTrigger
                      token={toToken}
                      chain={toChain}
                      onClick={() => {
                        setToTokenSelectorType('chain')
                        toTokenSelectorOpenState[1](
                          !toTokenSelectorOpenState[0]
                        )
                        onAnalyticEvent?.(EventNames.SWAP_START_TOKEN_SELECT, {
                          type: 'chain',
                          direction: 'output'
                        })
                      }}
                    />
                    <Flex align="center" justify="between" css={{ gap: '4' }}>
                      <AmountInput
                        value={
                          tradeType === 'EXACT_OUTPUT'
                            ? amountOutputValue
                            : amountOutputValue
                            ? formatFixedLength(amountOutputValue, 8)
                            : amountOutputValue
                        }
                        setValue={(e) => {
                          setAmountOutputValue(e)
                          setTradeType('EXACT_OUTPUT')
                          if (Number(e) === 0) {
                            setAmountInputValue('')
                            debouncedAmountOutputControls.flush()
                          }
                        }}
                        disabled={!toToken}
                        onFocus={() => {
                          onAnalyticEvent?.(EventNames.SWAP_OUTPUT_FOCUSED)
                        }}
                        css={{
                          fontWeight: '700',
                          fontSize: 28,
                          color:
                            isFetchingPrice && tradeType === 'EXACT_INPUT'
                              ? 'gray11'
                              : 'gray12',
                          _placeholder: {
                            color:
                              isFetchingPrice && tradeType === 'EXACT_INPUT'
                                ? 'gray11'
                                : 'gray12'
                          },
                          _disabled: {
                            cursor: 'not-allowed',
                            _placeholder: {
                              color: 'gray10'
                            }
                          }
                        }}
                      />
                      <TokenSelector
                        openState={toTokenSelectorOpenState}
                        type={toTokenSelectorType}
                        token={toToken}
                        setToken={(token) => {
                          onAnalyticEvent?.(EventNames.SWAP_TOKEN_SELECT, {
                            direction: 'output',
                            token_symbol: token.symbol
                          })
                          if (
                            token.address === fromToken?.address &&
                            token.chainId === fromToken?.chainId &&
                            address === recipient
                          ) {
                            handleSetToToken(fromToken)
                            handleSetFromToken(toToken)
                          } else {
                            handleSetToToken(token)
                          }
                        }}
                        context="to"
                        size={
                          toTokenSelectorType === 'chain' ? 'mobile' : 'desktop'
                        }
                        trigger={
                          <div
                            style={{ width: 'max-content' }}
                            onClick={() => setToTokenSelectorType('token')}
                          >
                            <SwapWidgetTokenTrigger
                              token={toToken}
                              locked={lockToToken}
                            />
                          </div>
                        }
                        onAnalyticEvent={onAnalyticEvent}
                      />
                    </Flex>
                    <Flex
                      align="center"
                      justify="between"
                      css={{ gap: '3', width: '100%' }}
                    >
                      {price?.details?.currencyOut?.amountUsd &&
                      Number(price.details.currencyOut.amountUsd) > 0 ? (
                        <Flex align="center" css={{ gap: '1' }}>
                          <Text style="subtitle3" color="subtle">
                            {formatDollar(
                              Number(price.details.currencyOut.amountUsd)
                            )}
                          </Text>
                          <PriceImpactTooltip feeBreakdown={feeBreakdown}>
                            {
                              <div>
                                <Flex align="center" css={{ gap: '1' }}>
                                  <Text
                                    style="subtitle3"
                                    color={
                                      feeBreakdown?.totalFees.priceImpactColor
                                    }
                                    css={{
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    (
                                    {
                                      feeBreakdown?.totalFees
                                        .priceImpactPercentage
                                    }
                                    )
                                  </Text>
                                  <Flex css={{ color: 'gray9' }}>
                                    <FontAwesomeIcon
                                      icon={faInfoCircle}
                                      width={16}
                                      style={{
                                        display: 'inline-block'
                                      }}
                                    />
                                  </Flex>
                                </Flex>
                              </div>
                            }
                          </PriceImpactTooltip>
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
                          />
                        ) : (
                          <Flex css={{ height: 18 }} />
                        )}
                      </Flex>
                    </Flex>
                  </TokenSelectorContainer>
                  <FetchingQuoteLoader
                    isLoading={isFetchingPrice}
                    containerCss={{
                      mb: '6px',
                      mt: 0,
                      p: '3',
                      width: '100%',
                      justifyContent: 'center',
                      borderRadius: 'widget-card-border-radius',
                      backgroundColor: 'widget-background'
                    }}
                  />
                  <FeeBreakdown
                    feeBreakdown={feeBreakdown}
                    isFetchingPrice={isFetchingPrice}
                    toToken={toToken}
                    fromToken={fromToken}
                    price={price}
                    timeEstimate={timeEstimate}
                    containerCss={{
                      border: 'none',
                      borderRadius: 'widget-card-border-radius',
                      backgroundColor: 'widget-background',
                      mb: '6px'
                    }}
                  />
                  <WidgetErrorWell
                    hasInsufficientBalance={hasInsufficientBalance}
                    hasInsufficientSafeBalance={false}
                    error={error}
                    quote={price}
                    currency={fromToken}
                    isHighRelayerServiceFee={highRelayerServiceFee}
                    relayerFeeProportion={relayerFeeProportion}
                    context="swap"
                    containerCss={{
                      mb: '6px'
                    }}
                  />
                  <SwapButton
                    transactionModalOpen={transactionModalOpen}
                    invalidSolanaRecipient={
                      isSvmSwap && !isValidSolanaRecipient
                    }
                    context={'Swap'}
                    onConnectWallet={onConnectWallet}
                    onAnalyticEvent={onAnalyticEvent}
                    price={price}
                    address={address}
                    hasInsufficientBalance={hasInsufficientBalance}
                    isInsufficientLiquidityError={isInsufficientLiquidityError}
                    debouncedInputAmountValue={debouncedInputAmountValue}
                    debouncedOutputAmountValue={debouncedOutputAmountValue}
                    isSameCurrencySameRecipientSwap={
                      isSameCurrencySameRecipientSwap
                    }
                    onClick={() => {
                      if (isSvmSwap && !isValidSolanaRecipient) {
                        setAddressModalOpen(true)
                      } else {
                        setTransactionModalOpen(true)
                      }
                    }}
                    ctaCopy={ctaCopy}
                  />
                </Flex>
              )
            }}
          </WidgetContainer>
        )
      }}
    </SwapWidgetRenderer>
  )
}

export default SwapWidget
