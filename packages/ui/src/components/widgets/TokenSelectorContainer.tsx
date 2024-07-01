import { type FC, type PropsWithChildren } from 'react'
import { Flex } from '../primitives/index.js'

const TokenSelectorContainer: FC<PropsWithChildren> = ({ children }) => {
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
        border: 'widget-card-border'
      }}
    >
      {children}
    </Flex>
  )
}

export default TokenSelectorContainer
