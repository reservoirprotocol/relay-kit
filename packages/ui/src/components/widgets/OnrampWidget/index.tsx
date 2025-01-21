import type { FC } from 'react'
import { useRelayClient } from '../../../hooks/index.js'
import OnrampWidgetRenderer from './OnrampWidgetRenderer.js'

type OnrampWidgetProps = {
  defaultWalletAddress?: string
}

const OnrampWidget: FC<OnrampWidgetProps> = ({}) => {
  const relayClient = useRelayClient()

  return (
    <OnrampWidgetRenderer>
      {({}) => {
        return <div></div>
      }}
    </OnrampWidgetRenderer>
  )
}

export default SwapWidget
