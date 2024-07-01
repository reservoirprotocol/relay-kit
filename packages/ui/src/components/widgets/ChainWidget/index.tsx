import { Flex, Button, Text, Box } from '../../primitives/index.js'
import { useEffect, useState, type FC } from 'react'
import { useMounted } from '../../../hooks/index.js'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
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
import WidgetTabs, { type WidgetTabId } from '../../widgets/WidgetTabs.js'

type ChainWidgetProps = {
  chainId: number
  defaultToken: Token
  tokens?: Token[]
  defaultToAddress?: Address
  defaultAmount?: string
  defaultTradeType?: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  onFromTokenChange?: (token?: Token) => void
  onToTokenChange?: (token?: Token) => void
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapSuccess?: (data: Execute) => void
  onSwapError?: (error: string, data?: Execute) => void
}

const ChainWidget: FC<ChainWidgetProps> = ({
  chainId,
  tokens,
  defaultToken,
  defaultToAddress,
  defaultAmount,
  defaultTradeType,
  onFromTokenChange,
  onToTokenChange,
  onConnectWallet,
  onAnalyticEvent,
  onSwapSuccess,
  onSwapError
}) => {
  const isMounted = useMounted()
  const [tabId, setTabId] = useState<WidgetTabId>('deposit')
  const lockFromToken = tabId === 'withdraw' && (!tokens || tokens.length === 0)
  const lockToToken = tabId === 'deposit' && (!tokens || tokens.length === 0)

  useEffect(() => {
    if (chainId !== defaultToken.chainId) {
      console.error('Default token chainId must match ChainWidget chainId')
    }
  }, [chainId, defaultToken])

  return (
    <SwapWidgetRenderer
      defaultAmount={defaultAmount}
      defaultToAddress={defaultToAddress}
      defaultTradeType={defaultTradeType}
      defaultToToken={defaultToken}
      onSwapError={onSwapError}
      onAnalyticEvent={onAnalyticEvent}
      context={tabId === 'deposit' ? 'Deposit' : 'Withdraw'}
    >
      {({
        quote,
        steps,
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
        swap,
        tradeType,
        setTradeType,
        details,
        waitingForSteps,
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
        isFetchingQuote,
        isLoadingFromBalance,
        fromBalance,
        highRelayerServiceFee,
        relayerFeeProportion,
        hasInsufficientBalance,
        isInsufficientLiquidityError,
        ctaCopy,
        isFromETH,
        setSteps,
        setDetails,
        setSwapError
      }) => {
        const handleSetFromToken = (token?: Token) => {
          setFromToken(token)
          onFromTokenChange?.(token)
        }
        const handleSetToToken = (token?: Token) => {
          setToToken(token)
          onToTokenChange?.(token)
        }

        return (
          <WidgetContainer
            steps={steps}
            fromToken={fromToken}
            toToken={toToken}
            swapError={swapError}
            quote={quote}
            details={details}
            address={address}
            onSwapModalOpenChange={(open) => {
              if (!open) {
                setSteps(null)
                setDetails(null)
                setSwapError(null)
              }
            }}
            onSwapSuccess={onSwapSuccess}
            onAnalyticEvent={onAnalyticEvent}
            setCustomToAddress={setCustomToAddress}
          >
            {({ setAddressModalOpen }) => {
              return (
                <>
                  <WidgetTabs
                    tabId={tabId}
                    setTabId={(newTabId) => {
                      switch (newTabId) {
                        case 'deposit':
                          handleSetFromToken(undefined)
                          handleSetToToken(defaultToken)
                          break
                        case 'withdraw':
                          handleSetFromToken(defaultToken)
                          handleSetToToken(undefined)
                          break
                      }
                      setTabId(newTabId)
                    }}
                  />
                  <TokenSelectorContainer>
                    <Text style="subtitle1">From</Text>
                    <Flex align="center" justify="between" css={{ gap: '4' }}>
                      <TokenSelector
                        token={fromToken}
                        restrictedTokensList={
                          tabId === 'withdraw' ? tokens : undefined
                        }
                        locked={lockFromToken}
                        onAnalyticEvent={onAnalyticEvent}
                        chainIdsFilter={
                          tabId === 'withdraw' ? [chainId] : undefined
                        }
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
                            isFetchingQuote && tradeType === 'EXACT_OUTPUT'
                              ? 'text-subtle'
                              : 'input-color',
                          _placeholder: {
                            color:
                              isFetchingQuote && tradeType === 'EXACT_OUTPUT'
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
                      {quote?.details?.currencyIn?.amountUsd &&
                      Number(quote.details.currencyIn.amountUsd) > 0 ? (
                        <Text style="subtitle3" color="subtle">
                          {formatDollar(
                            Number(quote.details.currencyIn.amountUsd)
                          )}
                        </Text>
                      ) : null}
                    </Flex>
                  </TokenSelectorContainer>
                  <TokenSelectorContainer>
                    <Flex css={{ width: '100%' }} justify="between">
                      <Text style="subtitle1">To</Text>
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
                            {toDisplayName}
                          </Text>
                          <FontAwesomeIcon icon={faChevronRight} width={8} />
                        </AnchorButton>
                      ) : null}
                    </Flex>
                    <Flex align="center" justify="between" css={{ gap: '4' }}>
                      <TokenSelector
                        token={toToken}
                        restrictedTokensList={
                          tabId === 'deposit' ? tokens : undefined
                        }
                        locked={lockToToken}
                        chainIdsFilter={
                          tabId === 'deposit' ? [chainId] : undefined
                        }
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
                            isFetchingQuote && tradeType === 'EXACT_INPUT'
                              ? 'gray11'
                              : 'gray12',
                          _placeholder: {
                            color:
                              isFetchingQuote && tradeType === 'EXACT_INPUT'
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
                      {quote?.details?.currencyOut?.amountUsd &&
                      Number(quote.details.currencyOut.amountUsd) > 0 ? (
                        <Flex align="center" css={{ gap: '1' }}>
                          <Text style="subtitle3" color="subtle">
                            {formatDollar(
                              Number(quote.details.currencyOut.amountUsd)
                            )}
                          </Text>
                          <Tooltip
                            content={
                              <Flex css={{ minWidth: 200 }} direction="column">
                                <Flex align="center" css={{ width: '100%' }}>
                                  <Text style="subtitle3" css={{ mr: 'auto' }}>
                                    Total Price Impact
                                  </Text>
                                  <Text style="subtitle3" css={{ mr: '1' }}>
                                    {feeBreakdown?.totalFees.priceImpact}
                                  </Text>
                                  <Text style="subtitle3" color="subtle">
                                    (
                                    {
                                      feeBreakdown?.totalFees
                                        .priceImpactPercentage
                                    }
                                    )
                                  </Text>
                                </Flex>
                                <Box
                                  css={{
                                    width: '100%',
                                    height: 1,
                                    backgroundColor: 'slate.6',
                                    marginTop: '2',
                                    marginBottom: '2'
                                  }}
                                />
                                <Flex align="center" css={{ width: '100%' }}>
                                  <Text
                                    style="subtitle3"
                                    color="subtle"
                                    css={{ mr: 'auto' }}
                                  >
                                    Swap Impact
                                  </Text>
                                  <Text style="subtitle3">
                                    {feeBreakdown?.totalFees.swapImpact}
                                  </Text>
                                </Flex>
                                {feeBreakdown?.breakdown.map((fee) => {
                                  if (fee.id === 'origin-gas') {
                                    return null
                                  }
                                  return (
                                    <Flex
                                      key={fee.id}
                                      align="center"
                                      css={{ width: '100%' }}
                                    >
                                      <Text
                                        style="subtitle3"
                                        color="subtle"
                                        css={{ mr: 'auto' }}
                                      >
                                        {fee.name}
                                      </Text>
                                      <Text style="subtitle3">{fee.usd}</Text>
                                    </Flex>
                                  )
                                })}
                              </Flex>
                            }
                          >
                            <div>
                              <Flex align="center">
                                <Text style="subtitle3" color="subtle">
                                  (
                                  {
                                    feeBreakdown?.totalFees
                                      .priceImpactPercentage
                                  }
                                  )
                                  <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    width={16}
                                    style={{
                                      display: 'inline-block',
                                      marginLeft: 4
                                    }}
                                  />
                                </Text>
                              </Flex>
                            </div>
                          </Tooltip>
                        </Flex>
                      ) : null}
                    </Flex>
                  </TokenSelectorContainer>
                  <FetchingQuoteLoader isLoading={isFetchingQuote} />
                  <FeeBreakdown
                    feeBreakdown={feeBreakdown}
                    isFetchingQuote={isFetchingQuote}
                    toToken={toToken}
                    fromToken={fromToken}
                    quote={quote}
                  />
                  <WidgetErrorWell
                    hasInsufficientBalance={hasInsufficientBalance}
                    hasInsufficientSafeBalance={false}
                    error={error}
                    quote={quote as Execute}
                    currency={fromToken}
                    isHighRelayerServiceFee={highRelayerServiceFee}
                    relayerFeeProportion={relayerFeeProportion}
                    context="swap"
                  />
                  <SwapButton
                    context={tabId === 'deposit' ? 'Deposit' : 'Withdraw'}
                    onConnectWallet={onConnectWallet}
                    onAnalyticEvent={onAnalyticEvent}
                    quote={quote}
                    address={address}
                    hasInsufficientBalance={hasInsufficientBalance}
                    isInsufficientLiquidityError={isInsufficientLiquidityError}
                    steps={steps}
                    waitingForSteps={waitingForSteps}
                    debouncedInputAmountValue={debouncedInputAmountValue}
                    debouncedOutputAmountValue={debouncedOutputAmountValue}
                    isSameCurrencySameRecipientSwap={
                      isSameCurrencySameRecipientSwap
                    }
                    swap={swap}
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

export default ChainWidget
