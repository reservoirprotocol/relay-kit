import { useState, type FC } from 'react'
import { Dropdown, DropdownMenuItem } from '../primitives/Dropdown.js'
import { Box, Button, Flex, Text } from '../primitives/index.js'
import type { LinkedWallet } from '../widgets/SwapWidget'
import { truncateAddress } from '../../utils/truncate.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { SystemStyleObject } from '@reservoir0x/relay-design-system/types/index.js'

type MultiWalletDropdownProps = {
  context: 'origin' | 'destination'
  wallets: LinkedWallet[]
  selectedWalletAddress: string
  onSelect: (wallet: LinkedWallet) => void
  onLinkNewWallet: () => void
  setAddressModalOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const MultiWalletDropdown: FC<MultiWalletDropdownProps> = ({
  context,
  wallets,
  selectedWalletAddress,
  onSelect,
  onLinkNewWallet,
  setAddressModalOpen
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Dropdown
      open={open}
      onOpenChange={(open) => setOpen(open)}
      trigger={
        <Button
          aria-label={`Multi wallet dropdown`}
          color="secondary"
          size="none"
          corners="pill"
          css={{
            gap: '2',
            px: '2 !important',
            py: '1',
            cursor: 'pointer',
            display: 'flex',
            alignContent: 'center'
          }}
        >
          <Text style="subtitle2" css={{ color: 'secondary-button-color' }}>
            {truncateAddress(selectedWalletAddress)}
          </Text>
          <Box css={{ color: 'secondary-button-color' }}>
            <FontAwesomeIcon icon={faChevronDown} width={14} height={14} />
          </Box>
        </Button>
      }
      contentProps={{
        sideOffset: 12,
        align: 'end',
        css: { maxWidth: 248, p: 0 }
      }}
    >
      <Flex direction="column" css={{ borderRadius: 12, p: '1', gap: '1' }}>
        {wallets.map((wallet, idx) => {
          return (
            <DropdownMenuItem
              aria-label={wallet.address}
              key={idx}
              onClick={() => {
                setOpen(false)
                onSelect(wallet)
              }}
              css={{
                ...DropdownItemBaseStyle,
                '--borderColor': 'colors.gray.6',
                border: '1px solid var(--borderColor)'
              }}
            >
              {wallet.walletLogoUrl ? (
                <img
                  src={wallet.walletLogoUrl}
                  style={{ width: 16, height: 16, borderRadius: 4 }}
                />
              ) : null}

              <Text style="subtitle2">{truncateAddress(wallet.address)}</Text>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuItem
          aria-label="Link a new wallet"
          css={{
            ...DropdownItemBaseStyle
          }}
          onClick={onLinkNewWallet}
        >
          <Text style="subtitle2">Link a new wallet</Text>
        </DropdownMenuItem>

        {context === 'destination' ? (
          <DropdownMenuItem
            aria-label="Paste wallet address"
            css={{
              ...DropdownItemBaseStyle
            }}
            onClick={() => setAddressModalOpen?.(true)}
          >
            <Text style="subtitle2">Paste wallet address</Text>
          </DropdownMenuItem>
        ) : null}
      </Flex>
    </Dropdown>
  )
}

const DropdownItemBaseStyle = {
  borderRadius: 8,
  gap: '2',
  cursor: 'pointer',
  p: '2',
  transition: 'backdrop-filter 250ms linear',
  _hover: {
    backdropFilter: 'brightness(98%)'
  },
  flexShrink: 0,
  alignContent: 'center',
  width: '100%'
}
