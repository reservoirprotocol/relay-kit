import { NextPage } from 'next'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'

const SwapWidgetPage: NextPage = () => {
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 50}}>
      <SwapWidget/>
    </div>
  )
}

export default SwapWidgetPage
