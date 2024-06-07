import { type FC } from 'react'
import {
  Anchor,
  Box,
  Button,
  Flex,
  Pill,
  Text,
  ChainTokenIcon
} from '../../../primitives'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt } from '@fortawesome/free-solid-svg-icons/faBolt'
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck'
import { truncateAddress } from '../../../../utils/truncate'
import getChainBlockExplorerUrl from '../../../../utils/getChainBlockExplorerUrl'
import { type TxHashes } from '../TransactionModalRenderer'
import { type Token } from '../../../../types'
import type { useRequests } from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from '../../../../hooks'

type SwapSuccessStepProps = {
  fromToken?: Token
  toToken?: Token
  fromAmountFormatted: string
  toAmountFormatted: string
  allTxHashes: TxHashes
  transaction: ReturnType<typeof useRequests>['data']['0']
  seconds: number
  fillTime: string
  onOpenChange: (open: boolean) => void
}

export const SwapSuccessStep: FC<SwapSuccessStepProps> = ({
  fromToken,
  toToken,
  fromAmountFormatted,
  toAmountFormatted,
  allTxHashes,
  transaction,
  fillTime,
  seconds,
  onOpenChange
}) => {
  const relayClient = useRelayClient()
  const isWrap =
    fromToken?.symbol === 'ETH' &&
    toToken?.symbol === 'WETH' &&
    fromToken.chainId === toToken.chainId
  const isUnwrap =
    fromToken?.symbol === 'WETH' &&
    toToken?.symbol === 'ETH' &&
    fromToken.chainId === toToken.chainId

  const actionTitle = isWrap ? 'wrapped' : isUnwrap ? 'unwrapped' : 'swapped'

  return (
    <>
      <Flex direction="column" align="center" justify="between">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20
          }}
        >
          <Flex
            align="center"
            justify="center"
            css={{
              height: 80,
              width: 80,
              backgroundColor: 'green2',
              '--borderColor': 'colors.green10',
              border: '6px solid var(--borderColor)',
              borderRadius: '999999px',
              position: 'relative'
            }}
          >
            {fillTime !== '-' && seconds <= 30 && seconds >= 0 ? (
              <Text style="h3">{fillTime}</Text>
            ) : (
              <Box css={{ color: 'success', mr: '$2' }}>
                <FontAwesomeIcon icon={faCheck} style={{ height: 40 }} />
              </Box>
            )}
            <Flex
              align="center"
              justify="center"
              css={{
                position: 'absolute',
                width: 50,
                height: 50,
                // @TODO: update theme colors
                background: 'primary3',
                color: 'primary-color',
                border: '3px solid modal-background',
                borderRadius: '999999px',
                right: -40,
                bottom: -12
              }}
            >
              <Box css={{ width: 29, height: 27 }}>
                <FontAwesomeIcon icon={faBolt} width={29} height={27} />
              </Box>
            </Flex>
          </Flex>
        </motion.div>

        <Text style="subtitle1" css={{ mt: '4', mb: '2', textAlign: 'center' }}>
          Successfully {actionTitle}
        </Text>

        <Flex align="center" css={{ gap: '2', mb: 20 }}>
          {fromToken ? (
            <Pill
              color="gray"
              css={{ align: 'center', py: '2', px: '3', gap: '2' }}
            >
              <ChainTokenIcon
                chainId={fromToken.chainId}
                tokenlogoURI={fromToken.logoURI}
                css={{ height: 20, width: 20 }}
              />
              <Text style="subtitle1" ellipsify>
                {fromAmountFormatted} {fromToken.symbol}
              </Text>
            </Pill>
          ) : (
            <Text style="subtitle1">?</Text>
          )}
          <Text style="subtitle1" color="subtle">
            to
          </Text>
          {toToken ? (
            <Pill
              color="gray"
              css={{ alignItems: 'center', py: '2', px: '3', gap: '2' }}
            >
              <ChainTokenIcon
                chainId={toToken.chainId}
                tokenlogoURI={toToken.logoURI}
                css={{ height: 20, width: 20 }}
              />
              <Text style="subtitle1" ellipsify>
                {toAmountFormatted} {toToken.symbol}
              </Text>
            </Pill>
          ) : (
            <Text style="subtitle1">?</Text>
          )}
        </Flex>
        {allTxHashes.map(({ txHash, chainId }) => {
          const blockExplorerBaseUrl = getChainBlockExplorerUrl(
            chainId,
            relayClient?.chains
          )
          return (
            <Anchor
              key={txHash}
              href={`${blockExplorerBaseUrl}/tx/${txHash}`}
              target="_blank"
            >
              View Tx: {truncateAddress(txHash)}
            </Anchor>
          )
        })}
      </Flex>

      <Flex css={{ width: '100%', mt: 8, gap: '3' }}>
        {transaction?.data?.inTxs?.[0]?.hash ? (
          <a
            href={`https://relay.link/transaction/${transaction?.data?.inTxs?.[0]?.hash}`}
            style={{ width: '100%' }}
            target="_blank"
          >
            <Button
              color="secondary"
              css={{
                justifyContent: 'center',
                width: 'max-content'
              }}
            >
              View Details
            </Button>
          </a>
        ) : null}
        <Button
          onClick={() => {
            onOpenChange(false)
          }}
          css={{
            justifyContent: 'center',
            width: '100%'
          }}
        >
          Done
        </Button>
      </Flex>
    </>
  )
}
