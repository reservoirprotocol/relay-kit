import { type FC } from 'react'
import { Text } from '../../primitives/index.js'

type TagPillProps = {
  tag: string
}

export const TagPill: FC<TagPillProps> = ({ tag }) => {
  return (
    <Text
      style="subtitle3"
      css={{
        backgroundColor: 'primary5',
        color: 'primary11',
        px: '6px',
        py: '4px',
        borderRadius: '100px',
        fontStyle: 'italic',
        lineHeight: '100%'
      }}
    >
      {tag}
    </Text>
  )
}
