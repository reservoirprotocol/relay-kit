import { useMemo, useState, type FC } from 'react'
import { Dropdown, DropdownMenuItem } from '../primitives/Dropdown.js'
import { Box, Button, Flex, Text } from '../primitives/index.js'
import type { LinkedWallet } from '../../types/index.js'
import { truncateAddress } from '../../utils/truncate.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faClipboard } from '@fortawesome/free-solid-svg-icons'
import type { ChainVM } from '@reservoir0x/relay-sdk'
import { solanaAddressRegex } from '../../utils/solana.js'
import { isAddress } from 'viem'
import { useENSResolver } from '../../hooks/index.js'

type MultiWalletDropdownProps = {
  context: 'origin' | 'destination'
  wallets: LinkedWallet[]
  selectedWalletAddress: string
  vmType: ChainVM | undefined
  onSelect: (wallet: LinkedWallet) => void
  onLinkNewWallet: () => void
  setAddressModalOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const MultiWalletDropdown: FC<MultiWalletDropdownProps> = ({
  context,
  wallets,
  selectedWalletAddress,
  vmType,
  onSelect,
  onLinkNewWallet,
  setAddressModalOpen
}) => {
  const [open, setOpen] = useState(false)

  const filteredWallets = useMemo(() => {
    if (!vmType) return wallets
    return wallets.filter((wallet) => wallet.vmType === vmType)
  }, [wallets, vmType])

  const isSupportedSelectedWallet = useMemo(() => {
    if (vmType === 'svm') {
      return solanaAddressRegex.test(selectedWalletAddress)
    } else {
      return isAddress(selectedWalletAddress)
    }
  }, [selectedWalletAddress, vmType])

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.address === selectedWalletAddress),
    [wallets, selectedWalletAddress]
  )

  const showDropdown = context !== 'origin' || filteredWallets.length > 0

  const { displayName } = useENSResolver(selectedWalletAddress, {
    enabled: vmType === 'evm'
  })

  return (
    <Dropdown
      open={showDropdown ? open : false}
      onOpenChange={(open) => showDropdown && setOpen(open)}
      trigger={
        <Button
          aria-label={`Multi wallet dropdown`}
          color={
            !selectedWallet && selectedWalletAddress ? 'warning' : 'secondary'
          }
          onClick={() => {
            if (!showDropdown) {
              onLinkNewWallet()
            }
          }}
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
          <Flex align="center" css={{ gap: '1' }}>
            {isSupportedSelectedWallet && selectedWallet?.walletLogoUrl ? (
              <img
                src={selectedWallet.walletLogoUrl}
                style={{ width: 16, height: 16, borderRadius: 4 }}
              />
            ) : selectedWalletAddress && !selectedWallet ? (
              <Box css={{ color: 'amber11' }}>
                <FontAwesomeIcon icon={faClipboard} width={16} height={16} />
              </Box>
            ) : null}
            <Text
              style="subtitle2"
              css={{
                color:
                  !selectedWallet && selectedWalletAddress
                    ? 'amber11'
                    : 'secondary-button-color'
              }}
            >
              {isSupportedSelectedWallet
                ? displayName && vmType === 'evm'
                  ? displayName
                  : truncateAddress(selectedWalletAddress)
                : 'Select wallet'}
            </Text>
          </Flex>
          {showDropdown && (
            <Box
              css={{
                color:
                  !selectedWallet && selectedWalletAddress
                    ? 'amber11'
                    : 'secondary-button-color'
              }}
            >
              <FontAwesomeIcon icon={faChevronDown} width={14} height={14} />
            </Box>
          )}
        </Button>
      }
      contentProps={{
        sideOffset: 12,
        align: 'end',
        css: { maxWidth: 248, p: 0 }
      }}
    >
      <Flex direction="column" css={{ borderRadius: 12, p: '1', gap: '1' }}>
        {filteredWallets.map((wallet, idx) => {
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
