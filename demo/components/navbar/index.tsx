import { FC } from 'react'
import { ThemeSwitcher } from './ThemeSwitcher'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BaseApiSwitcher } from './BaseApiSwitcher'

export const Navbar: FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '20px',
        padding: '20px'
      }}
    >
      <BaseApiSwitcher />
      <ThemeSwitcher />
      <ConnectButton />
    </div>
  )
}
