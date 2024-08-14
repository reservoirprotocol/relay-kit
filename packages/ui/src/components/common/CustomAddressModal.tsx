import { type FC, useState, useEffect } from 'react'
import { Text, Flex, Button, Input, Anchor } from '../primitives/index.js'
import { Modal } from '../common/Modal.js'
import { type Address } from 'viem'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet'
import { useENSResolver, useRelayClient } from '../../hooks/index.js'
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

type Props = {
  open: boolean
  toToken?: Token
  isSolanaSwap: boolean
  toAddress?: string
  onAnalyticEvent?: (eventName: string, data?: any) => void
  onOpenChange: (open: boolean) => void
  onConfirmed: (address: Address) => void
  onClear: () => void
}

export const CustomAddressModal: FC<Props> = ({
  open,
  toToken,
  isSolanaSwap,
  toAddress,
  onAnalyticEvent,
  onOpenChange,
  onConfirmed,
  onClear
}) => {
  const { isConnected, address: connectedAddress } = useAccount()
  const [address, setAddress] = useState('')
  const [input, setInput] = useState('')
  const client = useRelayClient()
  const toChain = client?.chains?.find((chain) => chain.id === toToken?.chainId)

  const isValidAddress = (input: string) => {
    const ethereumRegex = /^(0x)?[0-9a-fA-F]{40}$/
    return ethereumRegex.test(input) || solanaAddressRegex.test(input)
  }
  const connectedAddressSet =
    (!address && !toAddress) ||
    (toAddress === connectedAddress && address === connectedAddress)

  useEffect(() => {
    if (!open) {
      setAddress('')
      setInput('')
    } else {
      setAddress(toAddress ? toAddress : '')
      setInput(toAddress ? toAddress : '')
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
      contentCss={{
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
        <Text style="h5" css={{ mb: 8 }}>
          To Address
        </Text>
        <Flex direction="column" css={{ gap: '2', position: 'relative' }}>
          {address && toChain?.explorerUrl && (
            <Anchor
              css={{
                right: 4,
                top: 1,
                fontSize: 'small'
              }}
              target="_blank"
              href={`${toChain?.explorerUrl}/address/${address}`}
            >
              (View On Explorer)
            </Anchor>
          )}
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
                isSolanaSwap ? 'Enter Solana address' : 'Address or ENS'
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

          {!connectedAddressSet && isConnected && !isSolanaSwap ? (
            <Flex
              css={{ bg: 'amber2', p: '2', borderRadius: 8, gap: '2' }}
              align="center"
            >
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                color="#FFA01C"
                width={16}
                height={16}
              />
              <Text style="subtitle3" color="warning">
                This isn't the connected wallet address. Please ensure that the
                address provided is accurate.{' '}
              </Text>
            </Flex>
          ) : null}

          {!isSolanaSwap && isConnected ? (
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
        </Flex>
        <Button
          disabled={!isValidAddress(address)}
          css={{ justifyContent: 'center' }}
          onClick={() => {
            if (isValidAddress(address)) {
              onConfirmed(address as Address)
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
