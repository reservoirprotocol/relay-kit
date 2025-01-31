import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode
} from 'react'
import useRelayClient from '../../../../hooks/useRelayClient.js'
import { zeroAddress } from 'viem'
import { type ChainVM, type RelayChain } from '@reservoir0x/relay-sdk'
import type {
  FiatCurrency,
  LinkedWallet,
  Token
} from '../../../../types/index.js'
import useENSResolver from '../../../../hooks/useENSResolver.js'
import { ProviderOptionsContext } from '../../../../providers/RelayKitProvider.js'
import {
  findSupportedWallet,
  isValidAddress
} from '../../../../utils/address.js'
import useWalletAddress from '../../../../hooks/useWalletAddress.js'
import { useTokenPrice } from '@reservoir0x/relay-kit-hooks'
import { formatBN } from '../../../../utils/numbers.js'

export type ChildrenProps = {
  displayCurrency: boolean
  setDisplayCurrency: React.Dispatch<React.SetStateAction<boolean>>
  depositAddress?: string
  recipient?: string
  setRecipient: React.Dispatch<React.SetStateAction<string | undefined>>
  isRecipientLinked: boolean
  isValidRecipient: boolean
  amount: string
  setAmount: React.Dispatch<React.SetStateAction<string>>
  amountToToken: string
  setAmountToToken: React.Dispatch<React.SetStateAction<string>>
  setInputValue: (value: string, overrideDisplayCurrency?: boolean) => void
  fiatCurrency: FiatCurrency
  setFiatCurrency: React.Dispatch<React.SetStateAction<FiatCurrency>>
  token: Token
  fromToken: Token
  setToken: React.Dispatch<React.SetStateAction<Token>>
  toChain?: RelayChain
  fromChain?: RelayChain
  toDisplayName?: string
  toChainWalletVMSupported?: boolean
  amountToTokenFormatted?: string
  usdRate: number
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
    chainId: 7560,
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
  })
  const [displayCurrency, setDisplayCurrency] = useState(false)
  const { data: usdTokenPriceResponse } = useTokenPrice(
    client?.baseApiUrl,
    {
      address: token.address,
      chainId: token.chainId
    },
    {
      refetchInterval: 60000 * 5, //5 minutes
      refetchOnWindowFocus: false
    }
  )
  const usdRate = usdTokenPriceResponse?.price ?? 0

  const toChain = useMemo(
    () => client?.chains.find((chain) => chain.id === token.chainId),
    [token, client?.chains]
  )
  const toChainWalletVMSupported =
    !toChain?.vmType || supportedWalletVMs.includes(toChain?.vmType)

  const fromChain = useMemo(
    () =>
      client?.chains.find(
        (chain) => chain.id === (token.chainId === 8453 ? 10 : 8453)
      ),
    [token, client?.chains]
  )
  const fromCurrency =
    fromChain && fromChain.id === 8453
      ? '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
      : '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
  const fromToken: Token = {
    chainId: fromChain?.id ?? 8453,
    address: fromCurrency,
    symbol: 'USDC',
    name: 'USDC',
    logoURI:
      'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
    decimals: 6
  }

  const [amount, setAmount] = useState('20')
  const [amountToToken, setAmountToToken] = useState('')
  const [recipient, setRecipient] = useState<string | undefined>(
    defaultWalletAddress
  )
  const { displayName: toDisplayName } = useENSResolver(recipient, {
    refetchOnWindowFocus: false,
    enabled: toChain?.vmType === 'evm'
  })

  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>({
    name: 'US Dollar',
    code: 'usd',
    minAmount: 20,
    icon: 'https://static.moonpay.com/widget/currencies/usd.svg'
  })

  const address = useWalletAddress(undefined, linkedWallets)

  const defaultRecipient = useMemo(() => {
    const _linkedWallet = linkedWallets?.find(
      (linkedWallet) => recipient === linkedWallet.address
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

  useEffect(() => {
    setInputValue(displayCurrency ? amountToToken : amount)
  }, [usdRate])

  const amountToTokenFormatted = amountToToken
    ? formatBN(parseFloat(amountToToken), 5, token.decimals)
    : '-'

  const setInputValue = useCallback(
    (inputValue: string, overrideDisplayCurrency?: boolean) => {
      const _displayCurrency =
        overrideDisplayCurrency !== undefined
          ? overrideDisplayCurrency
          : displayCurrency
      if (_displayCurrency) {
        const _amountToToken = inputValue.replace(/[^0-9.]+/g, '')
        setAmountToToken(_amountToToken)
        const _amount =
          _amountToToken && +_amountToToken > 0 ? +_amountToToken * usdRate : 0
        setAmount(`${_amount}`)
      } else {
        let _amount = ''
        const numericValue = inputValue
          .replace(/[^0-9.]/g, '')
          .replace(/(\..*?)(\..*)/, '$1')
          .replace(/(\.\d{2})\d+/, '$1')
        const regex = /^[0-9]+(\.[0-9]*)?$/
        if (numericValue === '.' || numericValue.includes(',')) {
          _amount = '0.'
        } else if (regex.test(numericValue) || numericValue === '') {
          _amount = numericValue
        }
        const _amountToToken = _amount && +_amount > 0 ? +_amount / usdRate : 0
        setAmount(_amount)
        setAmountToToken(`${_amountToToken}`)
      }
    },
    [usdRate, displayCurrency]
  )

  return (
    <>
      {children({
        displayCurrency,
        setDisplayCurrency,
        recipient: _recipient,
        setRecipient,
        isRecipientLinked,
        isValidRecipient,
        amount,
        setAmount,
        amountToToken,
        setAmountToToken,
        setInputValue,
        token,
        fromToken,
        setToken,
        toChain,
        fromChain,
        toDisplayName,
        toChainWalletVMSupported,
        fiatCurrency,
        setFiatCurrency,
        amountToTokenFormatted,
        usdRate
      })}
    </>
  )
}

export default OnrampWidgetRenderer
