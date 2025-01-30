import { type FC, type ReactNode } from 'react'
import { CustomAddressModal } from '../common/CustomAddressModal.js'
import { SwapModal } from '../common/TransactionModal/SwapModal.js'
import { DepositAddressModal } from '../common/TransactionModal/DepositAddressModal.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import type { RelayChain, AdaptedWallet, Execute } from '@reservoir0x/relay-sdk'
import { useAccount } from 'wagmi'
import type { LinkedWallet } from '../../types/index.js'

export type WidgetContainerProps = {
  transactionModalOpen: boolean
  depositAddressModalOpen: boolean
  addressModalOpen: boolean
  toChain?: RelayChain
  fromChain?: RelayChain
  wallet?: AdaptedWallet
  linkedWallets?: LinkedWallet[]
  multiWalletSupportEnabled?: boolean
  setTransactionModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setDepositAddressModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setAddressModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  children: () => ReactNode
  onSwapModalOpenChange: (open: boolean) => void
  onDepositAddressModalOpenChange: (open: boolean) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapSuccess?: (data: Execute) => void
  onSwapValidating?: (data: Execute) => void
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
  | 'address'
  | 'setCustomToAddress'
  | 'useExternalLiquidity'
  | 'timeEstimate'
  | 'slippageTolerance'
>

const WidgetContainer: FC<WidgetContainerProps> = ({
  transactionModalOpen,
  setTransactionModalOpen,
  depositAddressModalOpen,
  setDepositAddressModalOpen,
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
  address,
  useExternalLiquidity,
  slippageTolerance,
  timeEstimate,
  recipient,
  toChain,
  wallet,
  linkedWallets,
  multiWalletSupportEnabled,
  onSwapModalOpenChange,
  onDepositAddressModalOpenChange,
  onSwapSuccess,
  onSwapValidating,
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
        <>
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
            slippageTolerance={slippageTolerance}
            address={address}
            recipient={recipient}
            isCanonical={useExternalLiquidity}
            timeEstimate={timeEstimate}
            onAnalyticEvent={onAnalyticEvent}
            onSuccess={onSwapSuccess}
            onSwapValidating={onSwapValidating}
            invalidateBalanceQueries={invalidateBalanceQueries}
            wallet={wallet}
            linkedWallets={linkedWallets}
            multiWalletSupportEnabled={multiWalletSupportEnabled}
          />
          <DepositAddressModal
            open={depositAddressModalOpen}
            onOpenChange={(open) => {
              onDepositAddressModalOpenChange(open)
              setDepositAddressModalOpen(open)
            }}
            fromChain={fromChain}
            fromToken={fromToken}
            toToken={toToken}
            debouncedInputAmountValue={debouncedInputAmountValue}
            debouncedOutputAmountValue={debouncedOutputAmountValue}
            address={address}
            recipient={recipient}
            timeEstimate={timeEstimate}
            onAnalyticEvent={onAnalyticEvent}
            onSuccess={onSwapSuccess}
            invalidateBalanceQueries={invalidateBalanceQueries}
          />
        </>
      ) : null}

      <CustomAddressModal
        open={addressModalOpen}
        toAddress={customToAddress}
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
