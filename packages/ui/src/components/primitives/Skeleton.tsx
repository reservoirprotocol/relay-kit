import type { FC } from 'react'
import Flex from './Flex.js'
import { type Styles } from '@reservoir0x/relay-design-system/css'

type SkeletonProps = {
  css?: Styles
}

const Skeleton: FC<SkeletonProps> = ({ css }) => {
  return (
    <Flex
      css={{
        animationName: 'pulse',
        backgroundColor: 'skeleton-background',
        borderRadius: 8,
        width: 100,
        height: 12,
        animation: 'pulse 3s ease-in-out infinite',
        ...css
      }}
    />
  )
}

export default Skeleton
