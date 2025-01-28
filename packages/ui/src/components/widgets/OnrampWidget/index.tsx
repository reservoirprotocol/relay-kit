import type { FC } from 'react'
import OnrampWidgetRenderer from './OnrampWidgetRenderer.js'
import { Box, Button, Flex, Pill, Text } from '../../primitives/index.js'
import AmountInput from '../../common/AmountInput.js'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDownLong,
  faArrowUpLong,
  faChevronDown,
  faClipboard,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons'
import TokenSelector from '../../common/TokenSelector/TokenSelector.js'
import { EventNames } from '../../../constants/events.js'
import { TokenTrigger } from '../../common/TokenSelector/triggers/TokenTrigger.js'
import type { LinkedWallet } from '../../../types/index.js'
import type { ChainVM, RelayChain } from '@reservoir0x/relay-sdk'
import { MultiWalletDropdown } from '../../../components/common/MultiWalletDropdown.js'
import { CustomAddressModal } from '../../../components/common/CustomAddressModal.js'
import { useAccount } from 'wagmi'
import * as Collapsible from '@radix-ui/react-collapsible'
import { StyledCollapsibleContent } from '../../common/StyledCollapisbleContent.js'
import { OnrampModal } from './modals/OnrampModal.js'

type BaseOnrampWidgetProps = {
  defaultWalletAddress?: string
  supportedWalletVMs: ChainVM[]
  moonpayApiKey?: string
  moonpayOnUrlSignatureRequested: (url: string) => Promise<string> | void
  onConnectWallet?: () => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

type MultiWalletDisabledProps = BaseOnrampWidgetProps & {
  multiWalletSupportEnabled?: false
  linkedWallets?: never
  onSetPrimaryWallet?: never
  onLinkNewWallet?: never
}

type MultiWalletEnabledProps = BaseOnrampWidgetProps & {
  multiWalletSupportEnabled: true
  linkedWallets: LinkedWallet[]
  onSetPrimaryWallet?: (address: string) => void
  onLinkNewWallet: (params: {
    chain?: RelayChain
    direction: 'to' | 'from'
  }) => Promise<LinkedWallet> | void
}

export type OnrampWidgetProps =
  | MultiWalletDisabledProps
  | MultiWalletEnabledProps

const OnrampWidget: FC<OnrampWidgetProps> = ({
  defaultWalletAddress,
  moonpayApiKey,
  moonpayOnUrlSignatureRequested,
  linkedWallets,
  multiWalletSupportEnabled,
  supportedWalletVMs,
  onConnectWallet,
  onLinkNewWallet,
  onSetPrimaryWallet,
  onAnalyticEvent
}) => {
  const [displayCurrency, setDisplayCurrency] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [feesOpen, setFeesOpen] = useState(false)
  const [onrampModalOpen, setOnrampModalOpen] = useState(false)
  const { isConnected } = useAccount()

  return (
    <OnrampWidgetRenderer
      defaultWalletAddress={defaultWalletAddress}
      supportedWalletVMs={supportedWalletVMs}
      moonpayApiKey={moonpayApiKey}
      linkedWallets={linkedWallets}
      multiWalletSupportEnabled={multiWalletSupportEnabled}
    >
      {({
        depositAddress,
        recipient,
        setRecipient,
        isRecipientLinked,
        isValidRecipient,
        amount,
        setAmount,
        token,
        fromToken,
        setToken,
        toChain,
        fromChain,
        toDisplayName,
        toChainWalletVMSupported,
        totalAmount,
        quote
      }) => {
        const formattedAmount =
          amount === ''
            ? ''
            : amount.endsWith('.')
              ? new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(+amount) + '.'
              : new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: amount.includes('.0')
                    ? 1
                    : amount.endsWith('0') && amount.includes('.')
                      ? 2
                      : 0,
                  maximumFractionDigits: amount.includes('.') ? 2 : 0
                }).format(+amount)

        const ctaDisabled = !recipient && !totalAmount

        return (
          <div
            className="relay-kit-reset"
            style={{ maxWidth: 400, minWidth: 408, width: '100%' }}
          >
            <Flex
              direction="column"
              css={{
                gap: '2',
                border: 'widget-border',
                width: '100%'
              }}
            >
              <Flex
                direction="column"
                css={{
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: 'widget-card-border-radius',
                  backgroundColor: 'widget-background',
                  border: 'widget-card-border',
                  mb: 'widget-card-section-gutter',
                  p: '4'
                }}
              >
                <Flex justify="between" align="center" css={{ mb: 28 }}>
                  <Text style="subtitle2" color="subtle">
                    You are buying
                  </Text>
                  <div>FIAT SELECTOR</div>
                </Flex>
                <AmountInput
                  value={displayCurrency ? '0.03' : formattedAmount}
                  setValue={(e) => {
                    setAmount(e)
                  }}
                  placeholder={displayCurrency ? '0' : '$0'}
                  onChange={
                    displayCurrency
                      ? undefined
                      : (e) => {
                          const inputValue = (e.target as HTMLInputElement)
                            .value
                          const numericValue = inputValue
                            .replace(/[^0-9.]/g, '')
                            .replace(/(\..*?)(\..*)/, '$1')
                            .replace(/(\.\d{2})\d+/, '$1')
                          const regex = /^[0-9]+(\.[0-9]*)?$/
                          console.log(numericValue)
                          if (
                            numericValue === '.' ||
                            numericValue.includes(',')
                          ) {
                            setAmount('0.')
                          } else if (
                            regex.test(numericValue) ||
                            numericValue === ''
                          ) {
                            setAmount(numericValue)
                          }
                        }
                  }
                  css={{
                    fontWeight: '700',
                    fontSize: 48,
                    lineHeight: '58px',
                    py: 0,
                    textAlign: 'center',
                    mb: '2'
                  }}
                />
                <button
                  style={{
                    gap: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}
                  onClick={() => {
                    setDisplayCurrency(!displayCurrency)
                  }}
                >
                  <Text style="body2" color="subtle">
                    {displayCurrency ? formattedAmount : '0.03 ETH'}
                  </Text>
                  <Flex
                    css={{
                      color: 'gray8'
                    }}
                  >
                    <FontAwesomeIcon
                      style={{ height: 14 }}
                      icon={faArrowUpLong}
                    />
                    <FontAwesomeIcon
                      style={{ height: 14 }}
                      icon={faArrowDownLong}
                    />
                  </Flex>
                </button>
                <TokenSelector
                  type={'token'}
                  // address={address} //TODO
                  // isValidAddress={isValidFromAddress}
                  token={token}
                  onAnalyticEvent={onAnalyticEvent}
                  depositAddressOnly={true}
                  // restrictedToken={toToken}
                  setToken={(token) => {
                    onAnalyticEvent?.(EventNames.SWAP_TOKEN_SELECT, {
                      direction: 'input',
                      token_symbol: token.symbol
                    })
                    setToken(token)
                  }}
                  context="to"
                  size={'desktop'}
                  trigger={
                    <div
                      style={{
                        width: 'max-content',
                        margin: '0 auto',
                        marginBottom: '16px'
                      }}
                    >
                      <TokenTrigger isSingleChainLocked={true} token={token} />
                    </div>
                  }
                />
                <Flex css={{ gap: '2', margin: '0 auto' }}>
                  <Button
                    color="white"
                    corners="pill"
                    css={{ minHeight: 28, px: 3, py: 1 }}
                    onClick={() => {
                      setAmount('100')
                    }}
                  >
                    <Text style="subtitle2">$100</Text>
                  </Button>
                  <Button
                    color="white"
                    corners="pill"
                    css={{ minHeight: 28, px: 3, py: 1 }}
                    onClick={() => {
                      setAmount('300')
                    }}
                  >
                    <Text style="subtitle2">$300</Text>
                  </Button>
                  <Button
                    color="white"
                    corners="pill"
                    css={{ minHeight: 28, px: 3, py: 1 }}
                    onClick={() => {
                      setAmount('1000')
                    }}
                  >
                    <Text style="subtitle2">$1,000</Text>
                  </Button>
                </Flex>
                <Box
                  css={{
                    width: '100%',
                    height: 1,
                    my: '3',
                    background: 'gray5'
                  }}
                />
                <Flex justify="between" align="center">
                  <Text color="subtle" style="subtitle2">
                    Recipient
                  </Text>
                  {multiWalletSupportEnabled === true &&
                  toChainWalletVMSupported ? (
                    <MultiWalletDropdown
                      context="origin"
                      selectedWalletAddress={recipient}
                      onSelect={(wallet) => setRecipient(wallet.address)}
                      chain={toChain}
                      onLinkNewWallet={() => {
                        if (
                          (!linkedWallets || linkedWallets.length === 0) &&
                          toChainWalletVMSupported
                        ) {
                          onConnectWallet?.()
                        } else {
                          onLinkNewWallet?.({
                            chain: toChain,
                            direction: 'to'
                          })?.then((wallet) => {
                            onSetPrimaryWallet?.(wallet.address)
                          })
                        }
                      }}
                      setAddressModalOpen={setAddressModalOpen}
                      wallets={linkedWallets!}
                      onAnalyticEvent={onAnalyticEvent}
                    />
                  ) : null}
                  {!multiWalletSupportEnabled || !toChainWalletVMSupported ? (
                    <Button
                      color={
                        isValidRecipient && !isRecipientLinked
                          ? 'warning'
                          : 'secondary'
                      }
                      corners="pill"
                      size="none"
                      css={{
                        display: 'flex',
                        alignItems: 'center',
                        px: '2',
                        py: '1'
                      }}
                      onClick={() => {
                        setAddressModalOpen(true)
                        onAnalyticEvent?.(EventNames.SWAP_ADDRESS_MODAL_CLICKED)
                      }}
                    >
                      {isValidRecipient && !isRecipientLinked ? (
                        <Box css={{ color: 'amber11' }}>
                          <FontAwesomeIcon
                            icon={faClipboard}
                            width={16}
                            height={16}
                          />
                        </Box>
                      ) : null}
                      <Text
                        style="subtitle2"
                        css={{
                          color:
                            isValidRecipient && !isRecipientLinked
                              ? 'amber11'
                              : 'secondary-button-color'
                        }}
                      >
                        {!isValidRecipient ? `Enter Address` : toDisplayName}
                      </Text>
                    </Button>
                  ) : null}
                </Flex>
              </Flex>
            </Flex>
            <Flex
              direction="column"
              css={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: 'widget-card-border-radius',
                backgroundColor: 'widget-background',
                border: 'widget-card-border',
                mb: 'widget-card-section-gutter',
                p: '4'
              }}
            >
              <Flex justify="between" align="center" css={{ mb: '3' }}>
                <Text color="subtle" style="subtitle2">
                  Paying with
                </Text>
                <Pill
                  css={{ px: '2', py: '6px', alignItems: 'center', gap: '2' }}
                  color="gray"
                  radius="squared"
                >
                  <FontAwesomeIcon style={{ width: 16 }} icon={faCreditCard} />
                  <Text style="subtitle2">Credit/Debit Card</Text>
                </Pill>
              </Flex>
              <Flex css={{ gap: '2' }} direction="column">
                <Collapsible.Root open={feesOpen} onOpenChange={setFeesOpen}>
                  <Collapsible.Trigger asChild>
                    <div>
                      <Flex
                        justify="between"
                        align="center"
                        css={{ cursor: 'pointer' }}
                      >
                        <Text style="h6">You Pay</Text>
                        <Flex align="center" css={{ gap: '2' }}>
                          <Text style="h6">{totalAmount}</Text>
                          <Text
                            style="body1"
                            css={{
                              color: 'gray9',
                              marginLeft: 'auto',
                              transition: 'all 0.25s ease-in-out',
                              transform: feesOpen
                                ? 'rotate(180deg)'
                                : 'rotate(0)',
                              width: 12
                            }}
                          >
                            <FontAwesomeIcon icon={faChevronDown} />
                          </Text>
                        </Flex>
                      </Flex>
                    </div>
                  </Collapsible.Trigger>
                  <StyledCollapsibleContent css={{ mt: '2' }}>
                    <Flex css={{ gap: '2' }}>
                      <Flex>
                        <Text style="subtitle2" color="subtle">
                          0.03 ETH
                        </Text>
                        <Text style="subtitle2">$100</Text>
                      </Flex>
                    </Flex>
                  </StyledCollapsibleContent>
                </Collapsible.Root>
              </Flex>
            </Flex>
            <Button
              css={{ width: '100%', justifyContent: 'center' }}
              disabled={ctaDisabled}
              onClick={() => {
                setOnrampModalOpen(true)
              }}
            >
              Buy
            </Button>
            <CustomAddressModal
              open={addressModalOpen}
              toAddress={recipient}
              toChain={toChain}
              isConnected={
                (linkedWallets && linkedWallets.length > 0) || isConnected
                  ? true
                  : false
              }
              linkedWallets={linkedWallets ?? []}
              multiWalletSupportEnabled={multiWalletSupportEnabled}
              onAnalyticEvent={onAnalyticEvent}
              onOpenChange={(open) => {
                setAddressModalOpen(open)
              }}
              onConfirmed={(address) => {
                setRecipient(address)
              }}
              onClear={() => {
                setRecipient(undefined)
              }}
            />
            <OnrampModal
              open={onrampModalOpen}
              onOpenChange={setOnrampModalOpen}
              onAnalyticEvent={onAnalyticEvent}
              moonpayOnUrlSignatureRequested={moonpayOnUrlSignatureRequested}
              fromToken={fromToken}
              toToken={token}
              fromChain={fromChain}
              toChain={toChain}
              depositAddress={depositAddress}
              totalAmount={totalAmount ? `${totalAmount}` : undefined}
              quote={quote}
              // onSuccess={}
            />
          </div>
        )
      }}
    </OnrampWidgetRenderer>
  )
}

export default OnrampWidget
