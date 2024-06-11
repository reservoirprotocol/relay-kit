import * as React from 'react'
import { Text } from '../primitives'

interface Props {
  error?: Error | null
}

const ErrorWell: React.FC<Props> = ({ error }) => {
  const renderedErrorMessage = React.useMemo((): React.ReactNode => {
    if (
      error?.message?.includes('An internal error was received.') ||
      !error?.message
    ) {
      return 'Oops! Something went wrong while processing your transaction.'
    }
    return error?.message
  }, [error?.message])

  return (
    <Text
      style="subtitle2"
      css={{
        mt: '4',
        mb: '2',
        textAlign: 'center',
        width: '100%',
        wordBreak: 'break-word'
      }}
    >
      {renderedErrorMessage}
    </Text>
  )
}

export default ErrorWell
