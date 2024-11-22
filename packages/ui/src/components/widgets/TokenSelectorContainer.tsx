import { type FC, type PropsWithChildren } from 'react'
import { Flex } from '../primitives/index.js'
import { type Styles } from '@reservoir0x/relay-design-system/css'

const TokenSelectorContainer: FC<
  PropsWithChildren & { css?: Styles; id?: string }
> = ({ children, css, id }) => {
  return (
    <Flex
      align="center"
      justify="between"
      id={id}
      css={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        backgroundColor: 'widget-card-background',
        border: 'widget-card-border',
        gap: '3',
        p: '12px 12px',
        borderRadius: 'widget-card-border-radius',
        ...css
      }}
    >
      {children}
    </Flex>
  )
}

export default TokenSelectorContainer
