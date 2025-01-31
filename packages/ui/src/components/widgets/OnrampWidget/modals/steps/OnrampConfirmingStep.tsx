import type { FC } from 'react'
import {
  Box,
  Button,
  ChainTokenIcon,
  Flex,
  Text
} from '../../../../primitives/index.js'
import type { Token } from '../../../../../types/index.js'
import { OnrampStep } from '../OnrampModal.js'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import { LoadingSpinner } from '../../../../common/LoadingSpinner.js'
import { EventNames } from '../../../../../constants/events.js'

type OnrampConfirmingStepProps = {
  toToken: Token
  fromToken: Token
  fromChain?: RelayChain
  toChain?: RelayChain
  requestId?: string
  depositAddress?: string
  recipient?: string
  amount?: string
  totalAmount?: string
  onAnalyticEvent?: (eventName: string, data?: any) => void
  setStep: (step: OnrampStep) => void
}

export const OnrampConfirmingStep: FC<OnrampConfirmingStepProps> = ({
  toToken,
  fromToken,
  fromChain,
  toChain,
  requestId,
  depositAddress,
  recipient,
  amount,
  totalAmount,
  onAnalyticEvent,
  setStep
}) => {
  return (
    <Flex
      direction="column"
      css={{
        width: '100%',
        height: '100%',
        gap: '4'
      }}
    >
      <Text style="h6">Buy {toToken?.name}</Text>
      <Flex
        direction="column"
        css={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'widget-card-border-radius',
          '--borderColor': 'colors.subtle-border-color',
          border: '1px solid var(--borderColor)',
          p: '4'
        }}
      >
        <Flex align="center" css={{ gap: '2' }}>
          <ChainTokenIcon
            chainId={fromToken?.chainId}
            tokenlogoURI={fromToken?.logoURI}
            css={{ width: 32, height: 32 }}
          />
          <Text style="subtitle1">
            You’ll purchase {fromToken?.symbol} via your card
          </Text>
        </Flex>
        <Box
          css={{
            height: 24,
            width: 1,
            background: 'gray5',
            my: '5px',
            ml: 4
          }}
        />
        <Flex align="center" css={{ gap: '2' }}>
          <ChainTokenIcon
            chainId={toToken?.chainId}
            tokenlogoURI={toToken?.logoURI}
            css={{ width: 32, height: 32 }}
          />
          <Text style="subtitle1">Relay converts to {toToken?.symbol}</Text>
        </Flex>
      </Flex>
      <Text style="subtitle2">
        This transaction occurs in two steps. MoonPay powers only your purchase
        of {fromToken?.symbol} ({fromChain?.displayName}) which Relay then
        converts to {toToken?.symbol} ({toChain?.displayName}).
      </Text>
      <Button
        disabled={!depositAddress}
        css={{ justifyContent: 'center' }}
        onClick={(e) => {
          onAnalyticEvent?.(EventNames.ONRAMP_CTA_CLICKED, {
            recipient,
            depositAddress,
            requestId,
            amount,
            totalAmount,
            toToken: toToken.address,
            toChain: toToken.chainId
          })
          setStep(OnrampStep.Moonpay)
        }}
      >
        {!depositAddress ? (
          <LoadingSpinner
            css={{ height: 16, width: 16, fill: 'button-disabled-color' }}
          />
        ) : (
          `Purchase ${fromToken?.symbol}`
        )}
      </Button>
    </Flex>
  )
}
