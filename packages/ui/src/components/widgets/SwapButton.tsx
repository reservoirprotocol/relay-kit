import { type FC } from 'react'
import { Button } from '../primitives/index.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import { EventNames } from '../../constants/events.js'

type SwapButtonProps = {
  transactionModalOpen: boolean
  depositAddressModalOpen: boolean
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onClick: () => void
  context: 'Swap' | 'Deposit' | 'Withdraw'
  showHighPriceImpactWarning: boolean
} & Pick<
  ChildrenProps,
  | 'quote'
  | 'address'
  | 'hasInsufficientBalance'
  | 'isInsufficientLiquidityError'
  | 'debouncedInputAmountValue'
  | 'debouncedOutputAmountValue'
  | 'isSameCurrencySameRecipientSwap'
  | 'ctaCopy'
  | 'isValidFromAddress'
  | 'isValidToAddress'
  | 'fromChainWalletVMSupported'
>

const SwapButton: FC<SwapButtonProps> = ({
  transactionModalOpen,
  depositAddressModalOpen,
  isValidFromAddress,
  isValidToAddress,
  context,
  showHighPriceImpactWarning,
  onConnectWallet,
  quote,
  address,
  hasInsufficientBalance,
  isInsufficientLiquidityError,
  debouncedInputAmountValue,
  debouncedOutputAmountValue,
  isSameCurrencySameRecipientSwap,
  fromChainWalletVMSupported,
  onClick,
  ctaCopy,
  onAnalyticEvent
}) => {
  const isMounted = useMounted()

  if (isMounted && (address || !fromChainWalletVMSupported)) {
    const invalidAmount =
      !quote ||
      Number(debouncedInputAmountValue) === 0 ||
      Number(debouncedOutputAmountValue) === 0

    return (
      <Button
        css={{ justifyContent: 'center' }}
        color={showHighPriceImpactWarning ? 'error' : 'primary'}
        aria-label={context}
        disabled={
          isValidToAddress &&
          (isValidFromAddress || !fromChainWalletVMSupported) &&
          (invalidAmount ||
            hasInsufficientBalance ||
            isInsufficientLiquidityError ||
            transactionModalOpen ||
            depositAddressModalOpen ||
            isSameCurrencySameRecipientSwap)
        }
        onClick={() => {
          onAnalyticEvent?.(EventNames.SWAP_BUTTON_CLICKED, {
            context,
            ctaCopy
          })
          onClick()
        }}
      >
        {ctaCopy}
      </Button>
    )
  }

  return (
    <Button
      css={{ justifyContent: 'center' }}
      aria-label="Connect wallet"
      onClick={() => {
        if (!onConnectWallet) {
          throw 'Missing onWalletConnect function'
        }

        onConnectWallet()
        onAnalyticEvent?.(EventNames.CONNECT_WALLET_CLICKED, {
          context
        })
      }}
    >
      Connect
    </Button>
  )
}

export default SwapButton
