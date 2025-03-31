import { NextPage } from 'next'
import { SlippageToleranceConfig, SwapWidget } from '@reservoir0x/relay-kit-ui'
import { Layout } from 'components/Layout'
import { useTheme } from 'next-themes'
import {
  useDynamicContext,
  useDynamicEvents,
  useDynamicModals,
  useSwitchWallet,
  useUserWallets,
  Wallet
} from '@dynamic-labs/sdk-react-core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isEthereumWallet } from '@dynamic-labs/ethereum'
import { isSolanaWallet } from '@dynamic-labs/solana'
import { adaptSolanaWallet } from '@reservoir0x/relay-svm-wallet-adapter'
import {
  AdaptedWallet,
  adaptViemWallet,
  ChainVM,
  RelayChain
} from '@reservoir0x/relay-sdk'
import { useWalletFilter } from 'context/walletFilter'
import { LinkedWallet } from '@reservoir0x/relay-kit-ui'
import { adaptBitcoinWallet } from '@reservoir0x/relay-bitcoin-wallet-adapter'
import { isBitcoinWallet } from '@dynamic-labs/bitcoin'
import { convertToLinkedWallet } from 'utils/dynamic'
import { isEclipseWallet } from '@dynamic-labs/eclipse'

const WALLET_VM_TYPES = ['evm', 'bvm', 'svm'] as const

const SwapWidgetPage: NextPage = () => {
  useDynamicEvents('walletAdded', (newWallet) => {
    if (linkWalletPromise) {
      linkWalletPromise?.resolve(convertToLinkedWallet(newWallet))
      setLinkWalletPromise(undefined)
    }
  })
  const { setWalletFilter } = useWalletFilter()
  const { setShowAuthFlow, primaryWallet } = useDynamicContext()
  const { theme } = useTheme()
  const [singleChainMode, setSingleChainMode] = useState(false)
  const [supportedWalletVMs, setSupportedWalletVMs] = useState<ChainVM[]>([
    ...WALLET_VM_TYPES
  ])
  const _switchWallet = useSwitchWallet()
  const { setShowLinkNewWalletModal } = useDynamicModals()
  const userWallets = useUserWallets()
  const wallets = useRef<Wallet<any>[]>()
  const switchWallet = useRef<(walletId: string) => Promise<void>>()
  const [wallet, setWallet] = useState<AdaptedWallet | undefined>()
  const [linkWalletPromise, setLinkWalletPromise] = useState<
    | {
        resolve: (value: LinkedWallet) => void
        reject: () => void
        params: { chain?: RelayChain; direction: 'to' | 'from' }
      }
    | undefined
  >()
  const [slippageTolerance, setSlippageTolerance] = useState<
    string | undefined
  >(undefined)

  const linkedWallets = useMemo(() => {
    const _wallets = userWallets.reduce((linkedWallets, wallet) => {
      linkedWallets.push(convertToLinkedWallet(wallet))
      return linkedWallets
    }, [] as LinkedWallet[])
    wallets.current = userWallets
    return _wallets
  }, [userWallets])

  useEffect(() => {
    switchWallet.current = _switchWallet
  }, [_switchWallet])

  useEffect(() => {
    const adaptWallet = async () => {
      try {
        if (primaryWallet !== null) {
          let adaptedWallet: AdaptedWallet | undefined
          if (isEthereumWallet(primaryWallet)) {
            const walletClient = await primaryWallet.getWalletClient()
            adaptedWallet = adaptViemWallet(walletClient)
          } else if (isBitcoinWallet(primaryWallet)) {
            const wallet = convertToLinkedWallet(primaryWallet)
            adaptedWallet = adaptBitcoinWallet(
              wallet.address,
              async (_address, _psbt, dynamicParams) => {
                try {
                  // Request the wallet to sign the PSBT
                  const response = await primaryWallet.signPsbt(dynamicParams)

                  if (!response) {
                    throw 'Missing psbt response'
                  }
                  return response.signedPsbt
                } catch (e) {
                  throw e
                }
              }
            )
          } else if (
            isSolanaWallet(primaryWallet) ||
            isEclipseWallet(primaryWallet)
          ) {
            const connection = await (primaryWallet as any).getConnection()
            const signer = await (primaryWallet as any).getSigner()
            const _chainId = isEclipseWallet(primaryWallet)
              ? 9286185
              : 792703809
            adaptedWallet = adaptSolanaWallet(
              primaryWallet.address,
              _chainId,
              connection,
              signer.signAndSendTransaction
            )
          }
          setWallet(adaptedWallet)
        } else {
          setWallet(undefined)
        }
      } catch (e) {
        setWallet(undefined)
      }
    }
    adaptWallet()
  }, [primaryWallet, primaryWallet?.address])

  return (
    <Layout
      styles={{
        background: theme === 'light' ? 'rgba(245, 242, 255, 1)' : '#1c172b'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 50,
          gap: 20
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 'max-content',
            gap: 8
          }}
        >
          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'end' }}
          >
            <SlippageToleranceConfig
              setSlippageTolerance={setSlippageTolerance}
              onAnalyticEvent={(eventName, data) => {
                console.log('Analytic Event', eventName, data)
              }}
            />
          </div>
          <SwapWidget
            key={`swap-widget-${singleChainMode ? 'single' : 'multi'}-chain`}
            lockChainId={singleChainMode ? 8453 : undefined}
            singleChainMode={singleChainMode}
            supportedWalletVMs={supportedWalletVMs}
            defaultToToken={
              singleChainMode
                ? {
                    chainId: 8453,
                    address: '0x4200000000000000000000000000000000000006',
                    decimals: 18,
                    name: 'WETH',
                    symbol: 'WETH',
                    logoURI:
                      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
                  }
                : {
                    chainId: 10,
                    address: '0x0000000000000000000000000000000000000000',
                    decimals: 18,
                    name: 'ETH',
                    symbol: 'ETH',
                    logoURI:
                      'https://assets.relay.link/icons/currencies/eth.png'
                  }
            }
            // defaultToToken={{
            //   chainId: 10,
            //   address: '0x0000000000000000000000000000000000000000',
            //   decimals: 18,
            //   name: 'ETH',
            //   symbol: 'ETH',
            //   logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
            // }}
            // lockToToken={true}
            // lockFromToken={true}
            defaultFromToken={{
              chainId: 8453,
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
              name: 'ETH',
              symbol: 'ETH',
              logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
            }}
            // defaultFromToken={{
            //   chainId: 1,
            //   address: '0x446c9033e7516d820cc9a2ce2d0b7328b579406f',
            //   decimals: 8,
            //   name: 'SOLVE',
            //   symbol: 'SOLVE',
            //   logoURI:
            //     'https://assets.coingecko.com/coins/images/1768/large/Solve.Token_logo_200_200_wiyhout_BG.png?1575869846'
            // }}
            // defaultAmount={'5'}
            wallet={wallet}
            multiWalletSupportEnabled={true}
            linkedWallets={linkedWallets}
            onLinkNewWallet={({ chain, direction }) => {
              if (linkWalletPromise) {
                linkWalletPromise.reject()
                setLinkWalletPromise(undefined)
              }
              if (chain?.vmType === 'evm') {
                setWalletFilter('EVM')
              } else if (chain?.id === 792703809) {
                setWalletFilter('SOL')
              } else if (chain?.id === 8253038) {
                setWalletFilter('BTC')
              } else if (chain?.id === 9286185) {
                setWalletFilter('ECLIPSE')
              } else {
                setWalletFilter(undefined)
              }
              const promise = new Promise<LinkedWallet>((resolve, reject) => {
                setLinkWalletPromise({
                  resolve,
                  reject,
                  params: {
                    chain,
                    direction
                  }
                })
              })
              setShowLinkNewWalletModal(true)
              return promise
            }}
            onSetPrimaryWallet={async (address: string) => {
              //In some cases there's a race condition between connecting the wallet and having it available to switch to so we need to poll for it
              const maxAttempts = 20
              let attemptCount = 0
              const timer = setInterval(async () => {
                attemptCount++
                const newPrimaryWallet = wallets.current?.find(
                  (wallet) =>
                    wallet.address === address ||
                    wallet.additionalAddresses.find(
                      (_address) => _address.address === address
                    )
                )
                if (attemptCount >= maxAttempts) {
                  clearInterval(timer)
                  return
                }
                if (!newPrimaryWallet || !switchWallet.current) {
                  return
                }
                try {
                  await switchWallet.current(newPrimaryWallet?.id)
                  clearInterval(timer)
                } catch (e) {}
              }, 200)
            }}
            onConnectWallet={() => {
              setShowAuthFlow(true)
            }}
            onAnalyticEvent={(eventName, data) => {
              console.log('Analytic Event', eventName, data)
            }}
            onFromTokenChange={(token) => {
              console.log('From token changed to: ', token)
            }}
            onToTokenChange={(token) =>
              console.log('To token changed to: ', token)
            }
            onSwapError={(e, data) => {
              console.log('onSwapError Triggered', e, data)
            }}
            onSwapSuccess={(data) => {
              console.log('onSwapSuccess Triggered', data)
            }}
            slippageTolerance={slippageTolerance}
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '40px',
          gap: '20px'
        }}
      >
        <div>
          <label>Single Chain Mode: </label>
          <input
            type="checkbox"
            checked={singleChainMode}
            onChange={(e) => setSingleChainMode(e.target.checked)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Supported Wallet VMs:
          </div>
          {WALLET_VM_TYPES.map((vm) => (
            <div
              key={vm}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <label htmlFor={`vm-${vm}`}>{vm.toUpperCase()}: </label>
              <input
                id={`vm-${vm}`}
                type="checkbox"
                checked={supportedWalletVMs.includes(vm)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSupportedWalletVMs((prev) => [...prev, vm])
                  } else {
                    setSupportedWalletVMs((prev) =>
                      prev.filter((item) => item !== vm)
                    )
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default SwapWidgetPage
