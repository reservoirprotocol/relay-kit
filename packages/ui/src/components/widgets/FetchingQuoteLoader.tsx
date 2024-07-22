import { type FC } from 'react'
import { Flex, Text } from '../primitives/index.js'
import { LoadingSpinner } from '../common/LoadingSpinner.js'

type Props = {
  isLoading: boolean
}

const FetchingQuoteLoader: FC<Props> = ({ isLoading }) => {
  if (!isLoading) {
    return null
  }

  return (
    <Flex
      align="center"
      css={{ gap: 14, mb: '3', mt: '1', p: '3 0', m: '0 auto' }}
    >
      <LoadingSpinner css={{ height: 16, width: 16 }} />
      <Text style="subtitle2">Fetching the best price</Text>
    </Flex>
  )
}

export default FetchingQuoteLoader
