import { NextPage } from 'next'
import { MAINNET_RELAY_API } from '@reservoir0x/relay-sdk'

import { useRelayChains } from '@reservoir0x/relay-kit-hooks'

const UseRelayChainsPage: NextPage = () => {
  const { data: response } = useRelayChains(MAINNET_RELAY_API)

  return (
    <div
      style={{
        marginTop: 20,
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '8px',
        marginLeft: '12px',
        marginRight: '12p',
        wordBreak: 'break-word'
      }}
    >
      {JSON.stringify(response?.chains)}
    </div>
  )
}

export default UseRelayChainsPage
