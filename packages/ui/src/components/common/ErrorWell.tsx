import * as React from 'react'
import { Text } from '../primitives/index.js'
import type { AxiosError } from 'axios'

interface Props {
  error?: Error | null | AxiosError
  hasTxHashes?: boolean
}

const ErrorWell: React.FC<Props> = ({ error, hasTxHashes }) => {
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
    if (!hasTxHashes) {
      return 'Oops, something went wrong while initiating the bridge. Your request was not submitted. Please try again.'
    } else if (error?.message?.includes('solver status check')) {
      return `Oops, it seems we can't check the status of your transaction at the moment. Please visit the transaction page for more details.`
    }
    return error?.message
  }, [error?.message, hasTxHashes])

  return (
    <Text
      style="subtitle1"
      css={{
        my: '4',
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
