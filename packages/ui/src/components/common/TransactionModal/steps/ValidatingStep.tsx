import type { FC } from 'react'
import { Anchor, Button, Flex, Text } from '../../../primitives'
import { LoadingSpinner } from '../../LoadingSpinner'
import { truncateAddress } from '../../../../utils/truncate'
import getChainBlockExplorerUrl from '../../../../utils/getChainBlockExplorerUrl'
import type { ExecuteStep, ExecuteStepItem } from '@reservoir0x/relay-sdk'
import { useRelayClient } from '../../../../hooks'

type ValidatingStepProps = {
  currentStep?: ExecuteStep | null
  currentStepItem?: ExecuteStepItem | null
}

export const ValidatingStep: FC<ValidatingStepProps> = ({
  currentStep,
  currentStepItem
}) => {
  const relayClient = useRelayClient()
  return (
    <>
      <Flex direction="column" align="center" justify="between">
        <LoadingSpinner css={{ height: 40, width: 40, fill: 'primary9' }} />
        <Text style="subtitle2" css={{ mt: '4', mb: '2', textAlign: 'center' }}>
          {currentStep?.description}
        </Text>
        {currentStepItem && currentStepItem.txHashes
          ? currentStepItem.txHashes.map(({ txHash, chainId }) => {
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
            })
          : null}
      </Flex>
      <Button
        disabled={true}
        css={{
          color: 'gray12 !important',
          mt: 8,
          justifyContent: 'center'
        }}
      >
        <LoadingSpinner css={{ height: 16, width: 16, fill: 'gray12' }} />
        Validating Transaction
      </Button>
    </>
  )
}
