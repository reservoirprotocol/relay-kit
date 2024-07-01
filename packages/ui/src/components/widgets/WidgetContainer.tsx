import { useState, type Dispatch, type FC, type ReactNode } from 'react'
import WidgetFooter from './WidgetFooter.js'
import { CustomAddressModal } from '../common/CustomAddressModal.js'
import { SwapModal } from '../common/TransactionModal/SwapModal.js'
import { useMounted } from '../../hooks/index.js'
import type { ChildrenProps } from './SwapWidgetRenderer.js'
import type { Execute } from '@reservoir0x/relay-sdk'
import { Flex } from '../primitives/index.js'

export type WidgetContainerProps = {
  children: (props: WidgetChildProps) => ReactNode
  onSwapModalOpenChange: (open: boolean) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onSwapSuccess?: (data: Execute) => void
} & Pick<
  ChildrenProps,
  | 'steps'
  | 'fromToken'
  | 'toToken'
  | 'swapError'
  | 'details'
  | 'quote'
  | 'address'
  | 'setCustomToAddress'
>

export type WidgetChildProps = {
  addressModalOpen: boolean
  setAddressModalOpen: Dispatch<React.SetStateAction<boolean>>
}

const WidgetContainer: FC<WidgetContainerProps> = ({
  children,
  steps,
  fromToken,
  toToken,
  swapError,
  quote,
  details,
  address,
  onSwapModalOpenChange,
  onSwapSuccess,
  onAnalyticEvent,
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
            open={steps !== null}
            onOpenChange={(open) => {
              onSwapModalOpenChange(open)
            }}
            fromToken={fromToken}
            toToken={toToken}
            error={swapError}
            steps={steps}
            details={details}
            fees={quote?.fees}
            address={address}
            onAnalyticEvent={onAnalyticEvent}
            onSuccess={onSwapSuccess}
          />
        ) : null}
        <CustomAddressModal
          open={addressModalOpen}
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
