import { useMemo, type FC } from 'react'
import { useRelayClient } from '../../../../hooks/index.js'
import type { TxHashes } from '../TransactionModalRenderer.js'
import { Flex, Anchor, Text, Skeleton } from '../../../primitives/index.js'
import { getTxBlockExplorerUrl } from '../../../../utils/getTxBlockExplorerUrl.js'
import { truncateAddress } from '../../../../utils/truncate.js'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { RelayChain } from '@reservoir0x/relay-sdk'
import type { useRequests } from '@reservoir0x/relay-kit-hooks'

type TransactionsByChainProps = {
  allTxHashes: TxHashes
  fromChain?: RelayChain | null
  toChain?: RelayChain | null
  refundData?: NonNullable<
    ReturnType<typeof useRequests>['data']['0']['data']
  >['refundCurrencyData']
  isSolverStatusTimeout?: boolean
}

export const TransactionsByChain: FC<TransactionsByChainProps> = ({
  allTxHashes,
  fromChain,
  toChain,
  refundData,
  isSolverStatusTimeout
}) => {
  const relayClient = useRelayClient()
  const refundChain = refundData
    ? relayClient?.chains.find(
        (chain) => chain.id === refundData?.currency?.chainId
      )
    : null
  const txHashesByChain = useMemo(() => {
    return allTxHashes.reduce(
      (byChains, txHash) => {
        if (!byChains[txHash.chainId]) {
          byChains[txHash.chainId] = []
        }
        byChains[txHash.chainId].push(txHash)
        return byChains
      },
      {} as Record<number, TxHashes>
    )
  }, [allTxHashes, relayClient?.chains])

  const refundTx =
    allTxHashes.length > 0 ? allTxHashes[allTxHashes.length - 1] : null

  const refundTxUrl =
    refundChain && refundData && refundTx
      ? getTxBlockExplorerUrl(
          refundChain?.id,
          relayClient?.chains,
          refundTx.txHash
        )
      : null

  return [fromChain, toChain].map((chain) => {
    return (
      <Flex justify="between">
        <Text style="subtitle2" color="subtle">
          View {chain?.displayName} Tx
        </Text>
        {chain?.id && txHashesByChain[chain.id] && !refundData ? (
          <Flex direction="column">
            {txHashesByChain[chain.id].map(({ txHash, chainId, isBatchTx }) => {
              const txUrl = getTxBlockExplorerUrl(
                chainId,
                relayClient?.chains,
                txHash
              )

              return txUrl && !isBatchTx ? (
                <Anchor
                  key={txHash}
                  href={txUrl}
                  target="_blank"
                  css={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2'
                  }}
                >
                  {truncateAddress(txHash)}
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} width={16} />
                </Anchor>
              ) : null
            })}
          </Flex>
        ) : null}
        {refundData && refundTxUrl ? (
          <Flex direction="column">
            <Anchor
              key={refundTx?.txHash}
              href={refundTxUrl}
              target="_blank"
              css={{
                display: 'flex',
                alignItems: 'center',
                gap: '2'
              }}
            >
              {truncateAddress(refundTx?.txHash)}
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} width={16} />
            </Anchor>
          </Flex>
        ) : null}
        {chain?.id && !txHashesByChain[chain.id] && !isSolverStatusTimeout ? (
          <Flex direction="column">
            <Text color="red" style="subtitle2">
              Order has not been filled yet
            </Text>
          </Flex>
        ) : null}
        {chain?.id && !txHashesByChain[chain.id] && isSolverStatusTimeout ? (
          <Flex direction="column">
            <Skeleton css={{ height: 20 }} />
          </Flex>
        ) : null}
      </Flex>
    )
  })
}
