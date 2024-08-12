import { type FC } from 'react'
import { Anchor, Box, Button, Flex, Text } from '../../../primitives/index.js'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons/faCircleExclamation'
import ErrorWell from '../../ErrorWell.js'
import { truncateAddress } from '../../../../utils/truncate.js'
import { type Address } from 'viem'
import { type TxHashes } from '../TransactionModalRenderer.js'
import { useRelayClient } from '../../../../hooks/index.js'

type ErrorStepProps = {
  error?: Error | null
  address?: Address
  allTxHashes: TxHashes
  onOpenChange: (open: boolean) => void
}

export const ErrorStep: FC<ErrorStepProps> = ({
  error,
  address,
  allTxHashes,
  onOpenChange
}) => {
  const isCapacityExceeded = error?.message?.includes('Capacity exceeded')
  const relayClient = useRelayClient()
  const baseTransactionUrl = relayClient?.baseApiUrl.includes('testnets')
    ? 'https://testnets.relay.link'
    : 'https://relay.link'

  return (
    <Flex
      direction="column"
      align="center"
      justify="between"
      css={{ width: '100%' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
      >
        <Box css={{ color: 'red9', mr: '$2' }}>
          <FontAwesomeIcon icon={faCircleExclamation} style={{ height: 40 }} />
        </Box>
      </motion.div>
      {isCapacityExceeded ? (
        <>
          <Text
            style="subtitle2"
            css={{ mt: '4', mb: '2', textAlign: 'center' }}
          >
            The request could not be fulfilled due to low relayer capacity. You
            will receive a refund shortly.
          </Text>

          <a
            href={`/transactions?address=${address}`}
            style={{ width: '100%' }}
            target="_blank"
          >
            <Button
              onClick={() => {
                onOpenChange(false)
              }}
              css={{
                mt: 12,
                justifyContent: 'center',
                width: '100%'
              }}
            >
              Track Refund
            </Button>
          </a>
        </>
      ) : (
        <>
          <ErrorWell
            error={error}
            hasTxHashes={allTxHashes && allTxHashes.length > 0}
          />
          {allTxHashes.map(({ txHash }) => {
            return (
              <Anchor
                key={txHash}
                href={`${baseTransactionUrl}/transactions/?txHash=${txHash}`}
                target="_blank"
              >
                View Tx: {truncateAddress(txHash)}
              </Anchor>
            )
          })}

          {allTxHashes && allTxHashes.length > 0 ? (
            <Button
              onClick={() => {
                onOpenChange(false)
              }}
              css={{
                mt: 12,
                justifyContent: 'center',
                width: '100%'
              }}
            >
              Done
            </Button>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false)
              }}
              css={{
                mt: 12,
                justifyContent: 'center',
                width: '100%'
              }}
            >
              Retry
            </Button>
          )}
        </>
      )}
    </Flex>
  )
}
