import { FC } from 'react'
import { ThemeSwitcher } from './ThemeSwitcher'
import { BaseApiSwitcher } from './BaseApiSwitcher'
import { ConnectButton } from 'components/ConnectButton'

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
