import * as React from 'react'
import { Text } from '../primitives/index.js'
import type { AxiosError } from 'axios'

interface Props {
  error?: Error | null | AxiosError
}

const ErrorWell: React.FC<Props> = ({ error }) => {
  const renderedErrorMessage = React.useMemo((): React.ReactNode => {
    if (error && ((error as AxiosError).response?.data as any)?.message) {
      return (error as any).response?.data?.message
    }
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
