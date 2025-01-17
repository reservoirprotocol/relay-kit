import type { FC } from 'react'
import { useRelayClient } from '../../../hooks/index.js'

type OnrampWidgetProps = {}

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
