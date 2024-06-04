import { type FC, useState, useEffect } from 'react'
import { Text, Flex, Button, Input, Anchor } from '../primitives'
import { Modal } from '../common/Modal'
import { type Address } from 'viem'
// import { EventNames } from '../../analytics/events'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet } from '@fortawesome/free-solid-svg-icons'
import { useENSResolver } from '../../hooks'
import { isENSName } from '../../utils/ens'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { useAccount } from 'wagmi'
import { type RelayChain } from '@reservoir0x/relay-sdk'

type Props = {
  open: boolean
  toChain: RelayChain
  onOpenChange: (open: boolean) => void
  onConfirmed: (address: Address) => void
  onClear: () => void
}

export const CustomAddressModal: FC<Props> = ({
  open,
  toChain,
  onOpenChange,
  onConfirmed,
  onClear
}) => {
  const { isConnected } = useAccount()
  const [address, setAddress] = useState('')
  const [input, setInput] = useState('')

  const isValidAddress = (input: string) => {
    const regex = /^(0x)?[0-9a-fA-F]{40}$/
    return regex.test(input)
  }

  useEffect(() => {
    if (!open) {
      setAddress('')
      setInput('')
    } else {
      // posthog.capture(EventNames.BRIDGE_ADDRESS_MODAL_OPEN)
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
          {address && (
            <Anchor
              css={{
                right: 4,
                top: 1,
                fontSize: 'small'
              }}
              target="_blank"
              href={`${toChain.explorerUrl}/address/${address}`}
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
              placeholder="Address or ENS"
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
                  position: 'absolute',
                  backgroundColor: 'gray3'
                }}
              />
            )}
          </Flex>
          {!address && input.length ? (
            <Text color="red" style="subtitle2">
              Not a valid address
            </Text>
          ) : null}

          <Button
            color="light"
            size="small"
            css={{ minHeight: 36, mr: 'auto' }}
            onClick={() => {
              onClear()
              onOpenChange(false)
            }}
          >
            <FontAwesomeIcon icon={faWallet} width={14} />
            <Text style="subtitle2" css={{ color: 'inherit' }}>
              {isConnected ? 'Connected Wallet' : 'Remove selected address'}
            </Text>
          </Button>
        </Flex>
        <Text style="body1" color="subtle">
          Please ensure that the address provided is accurate. Sending tokens to
          an incorrect address may result in irreversible loss.
        </Text>
        <Button
          disabled={!isValidAddress(address)}
          css={{ justifyContent: 'center' }}
          onClick={() => {
            if (isValidAddress(address)) {
              onConfirmed(address as Address)
              // posthog.capture(EventNames.BRIDGE_ADDRESS_SET, {
              //   to_address: address
              // })
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
