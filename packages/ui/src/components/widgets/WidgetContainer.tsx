import { type FC, type ReactNode } from 'react'
import { CustomAddressModal } from '../common/CustomAddressModal.js'
import { SwapModal } from '../common/TransactionModal/SwapModal.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import type { RelayChain, AdaptedWallet, Execute } from '@reservoir0x/relay-sdk'
import { useAccount } from 'wagmi'
import type { LinkedWallet } from '../widgets/SwapWidget/index.js'

export type WidgetContainerProps = {
  transactionModalOpen: boolean
  addressModalOpen: boolean
  isSvmSwap: boolean
  toChain?: RelayChain
  fromChain?: RelayChain
  wallet?: AdaptedWallet
  linkedWallets?: LinkedWallet[]
  multiWalletSupportEnabled?: boolean
  setTransactionModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setAddressModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  children: () => ReactNode
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

const WidgetContainer: FC<WidgetContainerProps> = ({
  transactionModalOpen,
  setTransactionModalOpen,
  addressModalOpen,
  setAddressModalOpen,
  children,
  fromChain,
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
  isSvmSwap,
  toChain,
  wallet,
  linkedWallets,
  multiWalletSupportEnabled,
  onSwapModalOpenChange,
  onSwapSuccess,
  onAnalyticEvent,
  invalidateBalanceQueries,
  setCustomToAddress
}) => {
  const isMounted = useMounted()
  const { isConnected } = useAccount()
  return (
    <div className="relay-kit-reset">
      {children()}
      {isMounted ? (
        <SwapModal
          open={transactionModalOpen}
          onOpenChange={(open) => {
            onSwapModalOpenChange(open)
            setTransactionModalOpen(open)
          }}
          fromChain={fromChain}
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
          wallet={wallet}
        />
      ) : null}
      <CustomAddressModal
        open={addressModalOpen}
        toAddress={customToAddress ?? address}
        isSvmSwap={isSvmSwap}
        toChain={toChain}
        isConnected={wallet !== undefined || isConnected ? true : false}
        linkedWallets={linkedWallets ?? []}
        multiWalletSupportEnabled={multiWalletSupportEnabled}
        wallet={wallet}
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
    </div>
  )
}

export default WidgetContainer
