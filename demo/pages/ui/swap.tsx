import { NextPage } from 'next'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { useConnectModal } from '@rainbow-me/rainbowkit'

const SwapWidgetPage: NextPage = () => {
    const { openConnectModal } = useConnectModal()

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 50}}>
      <SwapWidget  onConnectWallet={openConnectModal}/>
    </div>
  )
}

export default SwapWidgetPage
