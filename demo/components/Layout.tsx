import { FC, ReactNode } from 'react'
import { Navbar } from './navbar'

type LayoutProps = {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: '100vh'
      }}
    >
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
