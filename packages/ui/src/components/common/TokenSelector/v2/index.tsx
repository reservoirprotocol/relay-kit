import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Flex } from '../../../primitives/index.js'
import { Modal } from '../../Modal.js'
import type { Token } from '../../../../types/index.js'
import { type ChainFilterValue } from '../../ChainFilter.js'
import useRelayClient from '../../../../hooks/useRelayClient.js'
import { isAddress, type Address } from 'viem'
import { useDebounceState, useDuneBalances } from '../../../../hooks/index.js'
import { useMediaQuery } from 'usehooks-ts'
import { type Currency } from '@reservoir0x/relay-kit-hooks'
import { EventNames } from '../../../../constants/events.js'
import { UnverifiedTokenModal } from '../../UnverifiedTokenModal.js'
import {
  getRelayUiKitData,
  setRelayUiKitData
} from '../../../../utils/localStorage.js'

export type TokenSelectorProps = {
  openState?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  token?: Token
  restrictedToken?: Token
  trigger: ReactNode
  restrictedTokensList?: Token[]
  chainIdsFilter?: number[]
  lockedChainIds?: number[]
  context: 'from' | 'to'
  size?: 'mobile' | 'desktop'
  address?: Address | string
  isValidAddress?: boolean
  multiWalletSupportEnabled?: boolean
  depositAddressOnly?: boolean
  setToken: (token: Token) => void
  onAnalyticEvent?: (eventName: string, data?: any) => void
}

const TokenSelector: FC<TokenSelectorProps> = ({
  openState,
  token,
  restrictedToken,
  trigger,
  restrictedTokensList,
  chainIdsFilter,
  lockedChainIds,
  context,
  size = 'mobile',
  address,
  isValidAddress,
  multiWalletSupportEnabled = false,
  depositAddressOnly,
  setToken,
  onAnalyticEvent
}) => {
  const [unverifiedTokenModalOpen, setUnverifiedTokenModalOpen] =
    useState(false)
  const [unverifiedToken, setUnverifiedToken] = useState<Token | undefined>()

  const [internalOpen, setInternalOpen] = useState(false)
  const [open, setOpen] = openState || [internalOpen, setInternalOpen]
  const isSmallDevice = useMediaQuery('(max-width: 600px)')

  const [chainFilter, setChainFilter] = useState<ChainFilterValue>({
    id: undefined,
    name: 'All'
  })

  const {
    value: tokenSearchInput,
    debouncedValue: debouncedTokenSearchValue,
    setValue: setTokenSearchInput
  } = useDebounceState<string>('', 500)

  const resetState = useCallback(() => {
    setTokenSearchInput('')
    setChainFilter({ id: undefined, name: 'All' })
  }, [setTokenSearchInput])

  const handleTokenSelection = useCallback(
    (selectedToken: Token) => {
      const isVerified = selectedToken.metadata?.verified

      if (!isVerified) {
        const relayUiKitData = getRelayUiKitData()
        const tokenKey = `${selectedToken.chainId}:${selectedToken.address}`
        const isAlreadyAccepted =
          relayUiKitData.acceptedUnverifiedTokens.includes(tokenKey)

        if (isAlreadyAccepted) {
          setToken(selectedToken)
        } else {
          setUnverifiedToken(selectedToken)
          setUnverifiedTokenModalOpen(true)
          return
        }
      } else {
        setToken(selectedToken)
      }

      setOpen(false)
      resetState()
    },
    [setToken, setOpen, resetState]
  )

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open, resetState])

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Modal
          open={open}
          onOpenChange={(openChange) => {
            onAnalyticEvent?.(
              openChange
                ? EventNames.SWAP_START_TOKEN_SELECT
                : EventNames.SWAP_EXIT_TOKEN_SELECT,
              {
                direction: context === 'from' ? 'input' : 'output'
              }
            )
            setOpen(openChange)
          }}
          showCloseButton={true}
          trigger={trigger}
          css={{
            p: '4',
            display: 'flex',
            flexDirection: 'column',
            height: 'min(85vh, 600px)',
            '@media(min-width: 660px)': {
              minWidth: size === 'desktop' ? 660 : 400,
              maxWidth: size === 'desktop' ? 660 : 378
            }
          }}
        >
          <Flex
            direction="column"
            align="center"
            css={{
              width: '100%',
              height: '100%',
              gap: '3',
              position: 'relative',
              overflowY: 'hidden'
            }}
          >
            {/* Token selection content will go here */}
          </Flex>
        </Modal>
      </div>

      {unverifiedTokenModalOpen && (
        <UnverifiedTokenModal
          open={unverifiedTokenModalOpen}
          onOpenChange={setUnverifiedTokenModalOpen}
          token={unverifiedToken}
          onAcceptToken={(token) => {
            if (token) {
              const currentData = getRelayUiKitData()
              const tokenIdentifier = `${token.chainId}:${token.address}`

              if (
                !currentData.acceptedUnverifiedTokens.includes(tokenIdentifier)
              ) {
                setRelayUiKitData({
                  acceptedUnverifiedTokens: [
                    ...currentData.acceptedUnverifiedTokens,
                    tokenIdentifier
                  ]
                })
              }

              handleTokenSelection(token)
              onAnalyticEvent?.(EventNames.UNVERIFIED_TOKEN_ACCEPTED, { token })
            }
            setUnverifiedTokenModalOpen(false)
          }}
        />
      )}
    </>
  )
}

export default TokenSelector
