import { Flex, Button, Text, Box, ChainIcon } from '../../primitives/index.js'
import { useState, type FC } from 'react'
import { useMounted, useRelayClient } from '../../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits, zeroAddress } from 'viem'
import TokenSelector from '../../common/TokenSelector.js'
import type { Token } from '../../../types/index.js'
import { AnchorButton } from '../../primitives/Anchor.js'
import { formatFixedLength, formatDollar } from '../../../utils/numbers.js'
import AmountInput from '../../common/AmountInput.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle'
import type { Execute } from '@reservoir0x/relay-sdk'
import { WidgetErrorWell } from '../WidgetErrorWell.js'
import { BalanceDisplay } from '../../common/BalanceDisplay.js'
import { EventNames } from '../../../constants/events.js'
import Tooltip from '../../primitives/Tooltip.js'
import SwapWidgetRenderer from '../SwapWidgetRenderer.js'
import WidgetContainer from '../WidgetContainer.js'
import SwapButton from '../SwapButton.js'
import TokenSelectorContainer from '../TokenSelectorContainer.js'
import FetchingQuoteLoader from '../FetchingQuoteLoader.js'
import FeeBreakdown from '../FeeBreakdown.js'
import { mainnet } from 'viem/chains'
import { PriceImpactTooltip } from '../PriceImpactTooltip.js'

type SwapWidgetProps = {
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

const SwapWidget: FC<SwapWidgetProps> = ({
  defaultFromToken,
  defaultToToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  lockToToken = false,
  lockFromToken = false,
  onFromTokenChange,
  onToTokenChange,
  onConnectWallet,
  onAnalyticEvent,
  onSwapSuccess,
  onSwapError
}) => {
  const relayClient = useRelayClient()
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
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
        isSolanaSwap,
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
          if (token?.chainId !== 792703809 && isValidSolanaRecipient) {
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

        return (
          <WidgetContainer
            transactionModalOpen={transactionModalOpen}
            setTransactionModalOpen={setTransactionModalOpen}
            isSolanaSwap={isSolanaSwap}
            fromToken={fromToken}
            toToken={toToken}
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
            {({ setAddressModalOpen }) => {
              return (
                <>
                  <TokenSelectorContainer>
                    <Flex align="center" css={{ gap: '2' }}>
                      <Text style="subtitle1">From</Text>
                      {fromChain ? (
                        <Flex align="center" css={{ gap: '1' }}>
                          <ChainIcon
                            chainId={fromToken?.chainId}
                            width={16}
                            height={16}
                          />
                          <Text style="subtitle2" color="subtle">
                            {fromChain?.displayName}
                          </Text>
                        </Flex>
                      ) : null}
                    </Flex>
                    <Flex align="center" justify="between" css={{ gap: '4' }}>
                      <TokenSelector
                        token={fromToken}
                        locked={lockFromToken}
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
                      />
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
                          textAlign: 'right',
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
                    </Flex>
                    <Flex
                      align="center"
                      justify="between"
                      css={{ gap: '3', width: '100%' }}
                    >
                      <Flex align="center" css={{ gap: '3' }}>
                        {fromToken ? (
                          <BalanceDisplay
                            isLoading={isLoadingFromBalance}
                            balance={fromBalance}
                            decimals={fromToken?.decimals}
                            symbol={fromToken?.symbol}
                            hasInsufficientBalance={hasInsufficientBalance}
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
                      {price?.details?.currencyIn?.amountUsd &&
                      Number(price.details.currencyIn.amountUsd) > 0 ? (
                        <Text style="subtitle3" color="subtle">
                          {formatDollar(
                            Number(price.details.currencyIn.amountUsd)
                          )}
                        </Text>
                      ) : null}
                    </Flex>
                  </TokenSelectorContainer>
                  <Box
                    css={{
                      position: 'relative',
                      my: -10,
                      mx: 'auto',
                      height: hasLockedToken ? 30 : 40
                    }}
                  >
                    {hasLockedToken ? null : (
                      <Button
                        size="small"
                        color="white"
                        css={{
                          color: 'gray9',
                          alignSelf: 'center',
                          px: '2',
                          py: '2',
                          borderWidth: '2px !important',
                          minHeight: 30,
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
                  <TokenSelectorContainer>
                    <Flex css={{ width: '100%' }} justify="between">
                      <Flex align="center" css={{ gap: '2' }}>
                        <Text style="subtitle1">To</Text>
                        {toChain ? (
                          <Flex align="center" css={{ gap: '1' }}>
                            <ChainIcon
                              chainId={toToken?.chainId}
                              width={16}
                              height={16}
                            />
                            <Text style="subtitle2" color="subtle">
                              {toChain?.displayName}
                            </Text>
                          </Flex>
                        ) : null}
                      </Flex>

                      {isMounted && (address || customToAddress) ? (
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
                          <Text style="subtitle3" css={{ color: 'inherit' }}>
                            {isSolanaSwap && !isValidSolanaRecipient
                              ? 'Enter Solana Address'
                              : toDisplayName}
                          </Text>
                          <FontAwesomeIcon icon={faChevronRight} width={8} />
                        </AnchorButton>
                      ) : null}
                    </Flex>
                    <Flex align="center" justify="between" css={{ gap: '4' }}>
                      <TokenSelector
                        token={toToken}
                        locked={lockToToken}
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
                        onAnalyticEvent={onAnalyticEvent}
                      />
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
                          textAlign: 'right',
                          _disabled: {
                            cursor: 'not-allowed',
                            _placeholder: {
                              color: 'gray10'
                            }
                          }
                        }}
                      />
                    </Flex>
                    <Flex
                      align="center"
                      justify="between"
                      css={{ gap: '3', width: '100%' }}
                    >
                      {toToken ? (
                        <BalanceDisplay
                          isLoading={isLoadingToBalance}
                          balance={toBalance}
                          decimals={toToken?.decimals}
                          symbol={toToken?.symbol}
                        />
                      ) : (
                        <Flex css={{ height: 18 }} />
                      )}
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
                    </Flex>
                  </TokenSelectorContainer>
                  <FetchingQuoteLoader isLoading={isFetchingPrice} />
                  <FeeBreakdown
                    feeBreakdown={feeBreakdown}
                    isFetchingPrice={isFetchingPrice}
                    toToken={toToken}
                    fromToken={fromToken}
                    price={price}
                    timeEstimate={timeEstimate}
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
                  />
                  <SwapButton
                    transactionModalOpen={transactionModalOpen}
                    invalidSolanaRecipient={
                      isSolanaSwap && !isValidSolanaRecipient
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
                      if (isSolanaSwap && !isValidSolanaRecipient) {
                        setAddressModalOpen(true)
                      } else {
                        setTransactionModalOpen(true)
                      }
                    }}
                    ctaCopy={ctaCopy}
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
