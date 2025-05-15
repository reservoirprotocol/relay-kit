import { FC, PropsWithChildren, useEffect } from 'react'

type DebugProviderProps = PropsWithChildren<{
  name: string
}>

export const DebugProvider: FC<DebugProviderProps> = ({ children, name }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(`[Client] ${name} provider mounted`)
    }
  }, [name])

  if (typeof window === 'undefined') {
    console.log(`[Server] ${name} provider rendering`)
  }

  return <>{children}</>
}
