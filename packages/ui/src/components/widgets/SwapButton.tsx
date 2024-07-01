import { type FC } from 'react'
import { Button } from '../primitives/index.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import { EventNames } from '../../constants/events.js'

type SwapButtonProps = {
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
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

  if (!isMounted || !address) {
    return (
      <Button
        css={{ justifyContent: 'center' }}
        aria-label="Swap"
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
          context: 'bridge'
        })
      }}
    >
      Connect
    </Button>
  )
}

export default SwapButton
