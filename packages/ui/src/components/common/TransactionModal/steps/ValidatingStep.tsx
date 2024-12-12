import type { FC } from 'react'
import { Anchor, Button, Flex, Text } from '../../../primitives/index.js'
import { LoadingSpinner } from '../../LoadingSpinner.js'
import type { ExecuteStep, ExecuteStepItem } from '@reservoir0x/relay-sdk'
import { useRelayClient } from '../../../../hooks/index.js'
import { truncateAddress } from '../../../../utils/truncate.js'
import { getTxBlockExplorerUrl } from '../../../../utils/getTxBlockExplorerUrl.js'

type ValidatingStepProps = {
  currentStep?: ExecuteStep | null
  currentStepItem?: ExecuteStepItem | null
}

export const ValidatingStep: FC<ValidatingStepProps> = ({
  currentStep,
  currentStepItem
}) => {
  const relayClient = useRelayClient()
  const transactionBaseUrl =
    relayClient?.baseApiUrl && relayClient.baseApiUrl.includes('testnet')
      ? 'https://testnets.relay.link'
      : 'https://relay.link'
  const txHash =
    currentStepItem?.txHashes && currentStepItem.txHashes[0]
      ? currentStepItem.txHashes[0].txHash
      : undefined

  return (
    <>
      <Flex direction="column" align="center" justify="between">
        <LoadingSpinner
          css={{ height: 40, width: 40, fill: 'primary-color' }}
        />
        <Text style="subtitle2" css={{ mt: '4', mb: '2', textAlign: 'center' }}>
          {currentStep?.description}
        </Text>
        {currentStepItem?.progressState === 'validating_delayed' ? (
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
        {txHash && currentStep?.id !== 'approve' ? (
          <Text
            color="subtle"
            style="body2"
            css={{ mt: 12, textAlign: 'center' }}
          >
            Feel free to leave at any time, you can track your progress within
            the{' '}
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
        ) : (
          currentStepItem?.txHashes?.map(({ txHash, chainId }) => {
            const txUrl = getTxBlockExplorerUrl(
              chainId,
              relayClient?.chains,
              txHash
            )
            return (
              <Anchor key={txHash} href={txUrl} target="_blank">
                View Tx: {truncateAddress(txHash)}
              </Anchor>
            )
          })
        )}
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
