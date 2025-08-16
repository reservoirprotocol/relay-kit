import type { FC } from 'react'
import { Anchor, Button, Flex, Text } from '../../../primitives/index.js'
import { LoadingSpinner } from '../../LoadingSpinner.js'
import type { ExecuteStep, ExecuteStepItem } from '@relayprotocol/relay-sdk'
import { useExecutionStatus } from '@relayprotocol/relay-kit-hooks'
import { useRelayClient } from '../../../../hooks/index.js'
import getChainBlockExplorerUrl from '../../../../utils/getChainBlockExplorerUrl.js'
import { truncateAddress } from '../../../../utils/truncate.js'

type DepositAddressValidatingStepProps = {
  txHashes: string[]
  status: NonNullable<ReturnType<typeof useExecutionStatus>['data']>['status']
}

export const DepositAddressValidatingStep: FC<
  DepositAddressValidatingStepProps
> = ({ txHashes, status }) => {
  const relayClient = useRelayClient()
  const transactionBaseUrl =
    relayClient?.baseApiUrl && relayClient.baseApiUrl.includes('testnet')
      ? 'https://testnets.relay.link'
      : 'https://relay.link'
  const txHash = txHashes && txHashes[0] ? txHashes[0] : undefined

  return (
    <>
      <Flex direction="column" align="center" justify="between">
        <LoadingSpinner
          css={{ height: 40, width: 40, fill: 'primary-color' }}
        />
        <Text style="subtitle2" css={{ mt: '4', mb: '2', textAlign: 'center' }}>
          Funds received. Your transaction is now in progress.
        </Text>
        {status === 'delayed' ? (
          <Flex
            css={{ px: '4', py: '3', background: 'amber2', borderRadius: 12 }}
          >
            <Text style="subtitle2" css={{ textAlign: 'center' }}>
              Your transaction is currently delayed. We apologize for the
              inconvenience and appreciate your patience. After 5 minutes, your
              transaction will either be processed or refunded. If this is
              urgent, please contact support.
            </Text>
          </Flex>
        ) : null}
        <Text
          color="subtle"
          style="body2"
          css={{ mt: 12, textAlign: 'center' }}
        >
          Feel free to leave at any time, you can track your progress within the{' '}
          <Anchor
            href={`${transactionBaseUrl}/transaction/${txHash}`}
            target="_blank"
            rel="noreffer"
          >
            {' '}
            transaction page
          </Anchor>
          .
        </Text>
      </Flex>
      <Button
        disabled={true}
        css={{
          color: 'button-disabled-color !important',
          mt: 8,
          justifyContent: 'center'
        }}
      >
        <LoadingSpinner
          css={{ height: 16, width: 16, fill: 'button-disabled-color' }}
        />
        Validating Transaction
      </Button>
    </>
  )
}
