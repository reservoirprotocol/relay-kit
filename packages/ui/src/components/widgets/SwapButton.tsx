import { type FC } from 'react'
import { Button } from '../primitives/index.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import { EventNames } from '../../constants/events.js'

type SwapButtonProps = {
  transactionModalOpen: boolean
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onClick: () => void
  context: 'Swap' | 'Deposit' | 'Withdraw'
} & Pick<
  ChildrenProps,
  | 'price'
  | 'address'
  | 'hasInsufficientBalance'
  | 'isInsufficientLiquidityError'
  | 'debouncedInputAmountValue'
  | 'debouncedOutputAmountValue'
  | 'isSameCurrencySameRecipientSwap'
  | 'ctaCopy'
  | 'isValidFromAddress'
  | 'isValidToAddress'
>

const SwapButton: FC<SwapButtonProps> = ({
  transactionModalOpen,
  isValidFromAddress,
  isValidToAddress,
  context,
  onConnectWallet,
  price,
  address,
  hasInsufficientBalance,
  isInsufficientLiquidityError,
  debouncedInputAmountValue,
  debouncedOutputAmountValue,
  isSameCurrencySameRecipientSwap,
  onClick,
  ctaCopy,
  onAnalyticEvent
}) => {
  const isMounted = useMounted()

  if (isMounted && address) {
    return (
      <Button
        css={{ justifyContent: 'center' }}
        aria-label={context}
        disabled={
          isValidToAddress &&
          isValidFromAddress &&
          (!price ||
            hasInsufficientBalance ||
            isInsufficientLiquidityError ||
            transactionModalOpen ||
            Number(debouncedInputAmountValue) === 0 ||
            Number(debouncedOutputAmountValue) === 0 ||
            isSameCurrencySameRecipientSwap)
        }
        onClick={onClick}
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
