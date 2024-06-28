import { useContext } from 'react'
import ReservoirText from '../../img/ReservoirText.js'
import { Anchor, Flex, Text } from '../primitives/index.js'
import { ProviderOptionsContext } from '../../providers/RelayKitProvider.js'

const WidgetFooter = () => {
  const providerOptionsContext = useContext(ProviderOptionsContext)

  if (providerOptionsContext.disablePoweredByReservoir) {
    return null
  }

  return (
    <Flex
      align="center"
      css={{
        mx: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 12
      }}
    >
      <Text
        style="subtitle3"
        color="subtle"
        css={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          lineHeight: '12px',
          fontWeight: 400,
          color: 'text-subtle'
        }}
      >
        Powered by{' '}
        <Anchor
          href="https://reservoir.tools/"
          target="_blank"
          weight="heavy"
          color="gray"
          css={{
            height: 12,
            fontSize: 14,
            fill: 'gray11',
            _hover: { fill: 'gray12' }
          }}
        >
          <ReservoirText />
        </Anchor>
      </Text>
    </Flex>
  )
}

export default WidgetFooter
