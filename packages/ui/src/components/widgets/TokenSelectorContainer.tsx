import { type FC, type PropsWithChildren } from 'react'
import { Flex } from '../primitives/index.js'
import { type Styles } from '@reservoir0x/relay-design-system/css'

const TokenSelectorContainer: FC<PropsWithChildren & { css?: Styles }> = ({
  children,
  css
}) => {
  return (
    <Flex
      align="center"
      justify="between"
      css={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        backgroundColor: 'widget-card-background',
        gap: '3',
        p: '12px 12px',
        borderRadius: 'widget-card-border-radius',
        border: 'widget-card-border',
        ...css
      }}
    >
      {children}
    </Flex>
  )
}

export default TokenSelectorContainer
