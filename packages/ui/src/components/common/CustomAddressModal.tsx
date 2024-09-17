import { type FC, useState, useEffect, useMemo } from 'react'
import { Text, Flex, Button, Input, Pill } from '../primitives/index.js'
import { Modal } from '../common/Modal.js'
import { type Address } from 'viem'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useENSResolver, useWalletAddress } from '../../hooks/index.js'
import { isENSName } from '../../utils/ens.js'
import { LoadingSpinner } from '../common/LoadingSpinner.js'
import { useAccount } from 'wagmi'
import { EventNames } from '../../constants/events.js'
import { solanaAddressRegex } from '../../utils/solana.js'
import type { Token } from '../../types/index.js'
import {
  faCircleCheck,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { AnchorButton } from '../primitives/Anchor.js'
import type { AdaptedWallet, RelayChain } from '@reservoir0x/relay-sdk'
import type { LinkedWallet } from '../widgets/SwapWidget/index.js'
import { truncateAddress } from '../../utils/truncate.js'

type Props = {
  open: boolean
  toToken?: Token
  isSvmSwap: boolean
  toAddress?: string
  toChain?: RelayChain
  isConnected?: boolean
  multiWalletSupportEnabled?: boolean
  linkedWallets: LinkedWallet[]
  wallet?: AdaptedWallet
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onConfirmed: (address: Address | string) => void
  onClear: () => void
}

export const CustomAddressModal: FC<Props> = ({
  open,
  isSvmSwap,
  toAddress,
  toChain,
  linkedWallets,
  isConnected,
  multiWalletSupportEnabled,
  wallet,
  onAnalyticEvent,
  onOpenChange,
  onConfirmed,
  onClear
}) => {
  const connectedAddress = useWalletAddress(wallet)
  const [address, setAddress] = useState('')
  const [input, setInput] = useState('')

  const isValidAddress = (input: string) => {
    const ethereumRegex = /^(0x)?[0-9a-fA-F]{40}$/
    if (isSvmSwap) {
      return solanaAddressRegex.test(input)
    } else {
      return ethereumRegex.test(input)
    }
  }

  const availableWallets = useMemo(
    () => linkedWallets.filter((wallet) => isValidAddress(wallet.address)),
    [toChain, linkedWallets]
  )

  const connectedAddressSet =
    (!address && !toAddress) ||
    (toAddress === connectedAddress && address === connectedAddress) ||
    availableWallets.some((wallet) => wallet.address === toAddress)

  useEffect(() => {
    if (!open) {
      setAddress('')
      setInput('')
    } else {
      if (isValidAddress(toAddress ?? '')) {
        setAddress(toAddress ? toAddress : '')
        setInput(toAddress ? toAddress : '')
      }
      onAnalyticEvent?.(EventNames.ADDRESS_MODAL_OPEN)
    }
  }, [open])

  const { data: resolvedENS, isLoading } = useENSResolver(
    isENSName(input) ? input : ''
  )

  useEffect(() => {
    if (isValidAddress(input)) {
      setAddress(input)
    } else if (resolvedENS?.address) {
      setAddress(resolvedENS.address)
    } else {
      setAddress('')
    }
  }, [input, resolvedENS])

  return (
    <Modal
      trigger={null}
      open={open}
      onOpenChange={onOpenChange}
      css={{
        overflow: 'hidden'
      }}
    >
      <Flex
        direction="column"
        css={{
          width: '100%',
          height: '100%',
          gap: '4',
          sm: {
            width: 370
          }
        }}
      >
        <Text style="h6">To Address</Text>
        <Flex direction="column" css={{ gap: '2', position: 'relative' }}>
          <Flex
            css={{
              position: 'relative',
              display: 'inline-block'
            }}
          >
            <Input
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              className="ph-no-capture"
              css={{
                width: '100%',
                height: 48
              }}
              placeholder={
                isSvmSwap
                  ? `Enter ${toChain?.displayName} address`
                  : 'Address or ENS'
              }
              value={input}
              onChange={(e) => {
                setInput((e.target as HTMLInputElement).value)
              }}
            />
            {isLoading && (
              <LoadingSpinner
                css={{
                  right: 2,
                  top: 3,
                  position: 'absolute'
                }}
              />
            )}
          </Flex>
          {!address && input.length ? (
            <Text color="red" style="subtitle2">
              Not a valid address
            </Text>
          ) : null}

          {!connectedAddressSet && isConnected ? (
            <Flex
              css={{ bg: 'amber2', p: '2', borderRadius: 8, gap: '2' }}
              align="center"
            >
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                color="#FFA01C"
                width={16}
                height={16}
                style={{ flexShrink: 0 }}
              />
              <Text style="subtitle3" color="warning">
                This isn't the connected wallet address. Please ensure that the
                address provided is accurate.{' '}
              </Text>
            </Flex>
          ) : null}

          {!multiWalletSupportEnabled && isConnected ? (
            connectedAddressSet ? (
              <Flex
                css={{ bg: 'green2', p: '2', borderRadius: 8, gap: '2' }}
                align="center"
              >
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  color="#30A46C"
                  width={16}
                  height={16}
                />
                <Text style="subtitle3">Connected Wallet</Text>
              </Flex>
            ) : (
              <AnchorButton
                onClick={() => {
                  onClear()
                  onOpenChange(false)
                }}
              >
                Use connected wallet address
              </AnchorButton>
            )
          ) : null}

          {multiWalletSupportEnabled && linkedWallets.length > 0 ? (
            <>
              <Text style="subtitle2">Use connected wallet address</Text>
              <Flex css={{ gap: '2', flexWrap: 'wrap' }} align="center">
                {availableWallets.map((wallet) => (
                  <Pill
                    color="transparent"
                    bordered
                    radius="squared"
                    css={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      onConfirmed(wallet.address)
                      onOpenChange(false)
                      onAnalyticEvent?.(EventNames.ADDRESS_MODAL_CONFIRMED, {
                        address: wallet.address,
                        context: 'linked_wallet'
                      })
                    }}
                  >
                    <img
                      src={wallet.walletLogoUrl}
                      style={{ width: 16, height: 16, borderRadius: 4 }}
                    />
                    <Text style="subtitle2">
                      {truncateAddress(wallet.address)}
                    </Text>
                  </Pill>
                ))}
              </Flex>
            </>
          ) : null}
        </Flex>
        <Button
          disabled={!isValidAddress(address)}
          css={{ justifyContent: 'center' }}
          onClick={() => {
            if (isValidAddress(address)) {
              onConfirmed(address)
              onAnalyticEvent?.(EventNames.ADDRESS_MODAL_CONFIRMED, {
                address: address,
                context: 'input'
              })
            }
            onOpenChange(false)
          }}
        >
          Save
        </Button>
      </Flex>
    </Modal>
  )
}
