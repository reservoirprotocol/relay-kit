import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import useIsMounted from 'hooks/useIsMounted'
import { FC } from 'react'

export const ConnectButton: FC = () => {
  const isMounted = useIsMounted()
  if (!isMounted) return null

  return <DynamicWidget />
}
