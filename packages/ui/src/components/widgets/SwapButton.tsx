import { type FC } from 'react'
import { Button } from '../primitives/index.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import { EventNames } from '../../constants/events.js'

type SwapButtonProps = {
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  context: 'Swap' | 'Deposit' | 'Withdraw'
} & Pick<
  ChildrenProps,
  | 'quote'
  | 'address'
  | 'hasInsufficientBalance'
  | 'isInsufficientLiquidityError'
  | 'steps'
  | 'waitingForSteps'
  | 'debouncedInputAmountValue'
  | 'debouncedOutputAmountValue'
  | 'isSameCurrencySameRecipientSwap'
  | 'swap'
  | 'ctaCopy'
>

const SwapButton: FC<SwapButtonProps> = ({
  context,
  onConnectWallet,
  quote,
  address,
  hasInsufficientBalance,
  isInsufficientLiquidityError,
  steps,
  waitingForSteps,
  debouncedInputAmountValue,
  debouncedOutputAmountValue,
  isSameCurrencySameRecipientSwap,
  swap,
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
          !quote ||
          hasInsufficientBalance ||
          isInsufficientLiquidityError ||
          steps !== null ||
          waitingForSteps ||
          Number(debouncedInputAmountValue) === 0 ||
          Number(debouncedOutputAmountValue) === 0 ||
          isSameCurrencySameRecipientSwap
        }
        onClick={swap}
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
