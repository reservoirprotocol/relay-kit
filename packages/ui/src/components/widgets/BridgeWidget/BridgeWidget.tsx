import type { ConfigQuery } from '@reservoir0x/relay-kit-hooks'
import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { useState, type FC } from 'react'
import type { Address } from 'viem'
import BridgeWidgetRenderer from './BridgeWidgetRenderer.js'
import { Flex, Text } from '../../primitives/index.js'
import ChainSelector from './ChainSelector.js'
import { useMounted } from '../../../hooks/index.js'

type BridgeWidgetProps = {
  defaultFromChain: RelayChain
  defaultToChain: RelayChain
  defaultToAddress?: Address
  defaultAmount?: string
  defaultCurrency?: ConfigQuery['currency']
  modalHeader?: string
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onBridgeError?: (error: string, data?: Execute) => void
}

const BridgeWidget: FC<BridgeWidgetProps> = ({
  defaultFromChain,
  defaultToChain,
  defaultToAddress,
  defaultAmount,
  defaultCurrency,
  modalHeader,
  onConnectWallet,
  onAnalyticEvent,
  onBridgeError
}) => {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const isMounted = useMounted()

  return (
    <BridgeWidgetRenderer
      transactionModalOpen={transactionModalOpen}
      defaultFromChain={defaultFromChain}
      defaultToChain={defaultToChain}
      defaultToAddress={defaultToAddress}
      defaultAmount={defaultAmount}
      defaultCurrency={defaultCurrency}
    >
      {({
        fromChain,
        toChain,
        setFromChain,
        setToChain,
        price,
        isFetchingPrice,
        error,
        amountValue,
        debouncedAmountValue,
        setAmountValue,
        currency,
        setCurrency,
        depositableChains,
        withdrawableChains,
        bridgeType,
        setBridgeType,
        useExternalLiquidity,
        setUseExternalLiquidity,
        usePermit,
        fromBalance,
        fromBalanceIsLoading,
        toBalance,
        toBalanceIsLoading,
        hasInsufficientBalance,
        maxAmount,
        timeEstimate,
        ctaCopy
      }) => {
        return (
          <Flex
            direction="column"
            css={{
              width: 'auto',
              borderRadius: 'widget-border-radius',
              overflow: 'hidden',
              backgroundColor: 'widget-background',
              boxShadow: 'widget-box-shadow',
              border: 'widget-border',
              p: '4',
              minWidth: 300,
              maxWidth: 440
            }}
          >
            {modalHeader ? (
              <Text style="subtitle2" color="subtle" css={{ pb: '2' }}>
                {modalHeader}
              </Text>
            ) : null}
            <Flex
              align="center"
              justify="between"
              css={{
                gap: '6px',
                bp500: {
                  flexDir: 'row'
                },
                flexDir: 'column'
              }}
            >
              <ChainSelector
                titleText="From"
                options={withdrawableChains}
                value={fromChain}
                onSelect={(chain) => {
                  if (chain.id === toChain.id) {
                    setFromChain(toChain)
                    setToChain(fromChain)
                  } else {
                    setFromChain(chain)
                    setBridgeType('relay')
                  }
                }}
                currency={currency}
                balance={isMounted ? fromBalance : undefined}
                loadingBalance={fromBalanceIsLoading}
                hasInsufficientBalance={hasInsufficientBalance}
              />
            </Flex>
          </Flex>
        )
      }}
    </BridgeWidgetRenderer>
  )
}
