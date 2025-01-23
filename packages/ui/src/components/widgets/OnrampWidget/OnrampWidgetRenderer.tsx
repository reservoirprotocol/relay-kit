import { useQuote } from '@reservoir0x/relay-kit-hooks'
import { useContext, useMemo, useState, type FC, type ReactNode } from 'react'
import useRelayClient from '../../../hooks/useRelayClient.js'
import { parseUnits, zeroAddress } from 'viem'
import {
  getDeadAddress,
  type ChainVM,
  type Execute,
  type RelayChain
} from '@reservoir0x/relay-sdk'
import { extractDepositAddress } from '../../../utils/quote.js'
import type { LinkedWallet, Token } from '../../../types/index.js'
import useENSResolver from '~sdk/hooks/useENSResolver.js'
import { ProviderOptionsContext } from '../../../providers/RelayKitProvider.js'
import { findSupportedWallet, isValidAddress } from '~sdk/utils/address.js'
import useWalletAddress from '../../../hooks/useWalletAddress.js'

export type ChildrenProps = {
  depositAddress?: string
  recipient?: string
  setRecipient: React.Dispatch<React.SetStateAction<string | undefined>>
  isRecipientLinked: boolean
  isValidRecipient: boolean
  amount: string
  setAmount: React.Dispatch<React.SetStateAction<string>>
  token: Token
  setToken: React.Dispatch<React.SetStateAction<Token>>
  toChain?: RelayChain
  toDisplayName?: string
  toChainWalletVMSupported?: boolean
}

type OnrampWidgetRendererProps = {
  defaultWalletAddress?: string
  supportedWalletVMs: ChainVM[]
  linkedWallets?: LinkedWallet[]
  multiWalletSupportEnabled?: boolean
  children: (props: ChildrenProps) => ReactNode
}

const OnrampWidgetRenderer: FC<OnrampWidgetRendererProps> = ({
  defaultWalletAddress,
  linkedWallets,
  supportedWalletVMs,
  multiWalletSupportEnabled,
  children
}) => {
  const client = useRelayClient()
  const providerOptionsContext = useContext(ProviderOptionsContext)
  const connectorKeyOverrides = providerOptionsContext.vmConnectorKeyOverrides
  const [token, setToken] = useState<Token>({
    address: zeroAddress,
    chainId: 1,
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
  })
  const toChain = useMemo(
    () => client?.chains.find((chain) => chain.id === token.chainId),
    [token, client?.chains]
  )
  const toChainWalletVMSupported =
    !toChain?.vmType || supportedWalletVMs.includes(toChain?.vmType)
  const [amount, setAmount] = useState('20')
  const [recipient, setRecipient] = useState<string | undefined>(
    defaultWalletAddress
  )
  const { displayName: toDisplayName } = useENSResolver(recipient, {
    enabled: toChain?.vmType === 'evm'
  })
  const quote = useQuote(
    client ?? undefined,
    undefined,
    {
      originChainId: 1,
      originCurrency: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      destinationChainId: token?.chainId,
      destinationCurrency: token?.address,
      useDepositAddress: true,
      tradeType: 'EXACT_INPUT',
      amount: parseUnits(amount, 6).toString(),
      user: getDeadAddress(),
      recipient
    },
    undefined,
    undefined,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: recipient !== undefined
    }
  )

  const depositAddress = useMemo(
    () => extractDepositAddress(quote?.data?.steps as Execute['steps']),
    [quote]
  )

  const address = useWalletAddress(undefined, linkedWallets)

  const defaultRecipient = useMemo(() => {
    const _linkedWallet = linkedWallets?.find(
      (linkedWallet) => address === linkedWallet.address
    )
    const _isValidRecipient = isValidAddress(
      toChain?.vmType,
      recipient ?? '',
      toChain?.id,
      _linkedWallet?.address === recipient
        ? _linkedWallet?.connector
        : undefined,
      connectorKeyOverrides
    )
    if (
      multiWalletSupportEnabled &&
      toChain &&
      linkedWallets &&
      !_isValidRecipient
    ) {
      const supportedAddress = findSupportedWallet(
        toChain,
        recipient,
        linkedWallets,
        connectorKeyOverrides
      )

      return supportedAddress
    }
  }, [
    multiWalletSupportEnabled,
    toChain,
    recipient,
    linkedWallets,
    setRecipient
  ])

  const _recipient =
    recipient && recipient.length > 0 ? recipient : defaultRecipient

  const isRecipientLinked =
    (_recipient
      ? linkedWallets?.find((wallet) => wallet.address === _recipient) ||
        address === _recipient
      : undefined) !== undefined

  const isValidRecipient = isValidAddress(
    toChain?.vmType,
    _recipient ?? '',
    toChain?.id
  )

  return (
    <>
      {children({
        depositAddress,
        recipient: _recipient,
        setRecipient,
        isRecipientLinked,
        isValidRecipient,
        amount,
        setAmount,
        token,
        setToken,
        toChain,
        toDisplayName,
        toChainWalletVMSupported
      })}
    </>
  )
}

export default OnrampWidgetRenderer
