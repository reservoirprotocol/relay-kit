import { CSSProperties, FC, ReactNode } from 'react'
import { Navbar } from './navbar'
import useIsMounted from 'hooks/useIsMounted'

type LayoutProps = {
  children: ReactNode
  styles?: CSSProperties
}

export const Layout: FC<LayoutProps> = ({ children, styles }) => {
  const isMounted = useIsMounted()

  if (!isMounted) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        ...styles
      }}
    >
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
