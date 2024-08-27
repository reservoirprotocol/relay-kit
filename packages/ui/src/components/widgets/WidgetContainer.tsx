import { useState, type Dispatch, type FC, type ReactNode } from 'react'
import WidgetFooter from './WidgetFooter.js'
import { CustomAddressModal } from '../common/CustomAddressModal.js'
import { SwapModal } from '../common/TransactionModal/SwapModal.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import type { Execute } from '@reservoir0x/relay-sdk'
import { Flex } from '../primitives/index.js'

export type WidgetContainerProps = {
  transactionModalOpen: boolean
  isSolanaSwap: boolean
  setTransactionModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  children: (props: WidgetChildProps) => ReactNode
  onSwapModalOpenChange: (open: boolean) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapSuccess?: (data: Execute) => void
  invalidateBalanceQueries: () => void
} & Pick<
  ChildrenProps,
  | 'fromToken'
  | 'toToken'
  | 'amountInputValue'
  | 'amountOutputValue'
  | 'debouncedInputAmountValue'
  | 'debouncedOutputAmountValue'
  | 'recipient'
  | 'customToAddress'
  | 'tradeType'
  | 'swapError'
  | 'price'
  | 'address'
  | 'setCustomToAddress'
  | 'useExternalLiquidity'
  | 'timeEstimate'
>

export type WidgetChildProps = {
  addressModalOpen: boolean
  setAddressModalOpen: Dispatch<React.SetStateAction<boolean>>
}

const WidgetContainer: FC<WidgetContainerProps> = ({
  transactionModalOpen,
  setTransactionModalOpen,
  children,
  fromToken,
  toToken,
  debouncedInputAmountValue,
  debouncedOutputAmountValue,
  amountInputValue,
  amountOutputValue,
  tradeType,
  customToAddress,
  swapError,
  price,
  address,
  useExternalLiquidity,
  timeEstimate,
  recipient,
  isSolanaSwap,
  onSwapModalOpenChange,
  onSwapSuccess,
  onAnalyticEvent,
  invalidateBalanceQueries,
  setCustomToAddress
}) => {
  const isMounted = useMounted()
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  return (
    <div className="relay-kit-reset">
      <Flex
        direction="column"
        css={{
          width: '100%',
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
        {children({
          addressModalOpen,
          setAddressModalOpen
        })}
        {isMounted ? (
          <SwapModal
            open={transactionModalOpen}
            onOpenChange={(open) => {
              onSwapModalOpenChange(open)
              setTransactionModalOpen(open)
            }}
            fromToken={fromToken}
            toToken={toToken}
            amountInputValue={amountInputValue}
            amountOutputValue={amountOutputValue}
            debouncedInputAmountValue={debouncedInputAmountValue}
            debouncedOutputAmountValue={debouncedOutputAmountValue}
            tradeType={tradeType}
            useExternalLiquidity={useExternalLiquidity}
            address={address}
            recipient={recipient}
            isCanonical={useExternalLiquidity}
            timeEstimate={timeEstimate}
            onAnalyticEvent={onAnalyticEvent}
            onSuccess={onSwapSuccess}
            invalidateBalanceQueries={invalidateBalanceQueries}
          />
        ) : null}
        <CustomAddressModal
          open={addressModalOpen}
          toAddress={customToAddress ?? address}
          isSolanaSwap={isSolanaSwap}
          onAnalyticEvent={onAnalyticEvent}
          onOpenChange={(open) => {
            setAddressModalOpen(open)
          }}
          onConfirmed={(address) => {
            setCustomToAddress(address)
          }}
          onClear={() => {
            setCustomToAddress(undefined)
          }}
        />
        <WidgetFooter />
      </Flex>
    </div>
  )
}

export default WidgetContainer
