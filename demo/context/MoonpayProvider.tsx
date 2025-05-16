import { FC, PropsWithChildren, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MoonPayProviderBase = dynamic(
  () => import('@moonpay/moonpay-react').then((mod) => mod.MoonPayProvider),
  { ssr: false }
)

export const MoonPayProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{children}</>
  }

  return (
    <MoonPayProviderBase
      apiKey={process.env.NEXT_PUBLIC_MOONPAY_API_KEY as string}
      debug
    >
      {children}
    </MoonPayProviderBase>
  )
}
