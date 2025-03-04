import { useMemo, type FC } from 'react'
import {
  Flex,
  Text,
  ChainTokenIcon,
  Box,
  Anchor,
  ChainIcon
} from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type Token } from '../../../../types/index.js'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'
import type { useQuote } from '@reservoir0x/relay-kit-hooks'
import type { Execute, RelayChain } from '@reservoir0x/relay-sdk'
import useRelayClient from '../../../../hooks/useRelayClient.js'
import { faCheck, faExternalLink } from '@fortawesome/free-solid-svg-icons'
import { getTxBlockExplorerUrl } from '../../../../utils/getTxBlockExplorerUrl.js'
import { truncateAddress } from '../../../../utils/truncate.js'
import { getStepActionText } from '../../../../utils/getStepActionText.js'

type FormattedStep = {
  id: string
  action: string
  isActive: boolean
  isCompleted: boolean
  progressState?: NonNullable<
    Execute['steps']['0']['items']
  >[0]['progressState']
  txHashes?: { txHash: string; chainId: number }[]
  isWalletAction: boolean
  chainId?: number
  isApproveStep?: boolean
}

type SwapConfirmationStepProps = {
  fromToken?: Token
  toToken?: Token
  fromChain?: RelayChain
  toChain?: RelayChain
  fromAmountFormatted: string
  toAmountFormatted: string
  quote?: ReturnType<typeof useQuote>['data']
  steps: Execute['steps'] | null
}

export const SwapConfirmationStep: FC<SwapConfirmationStepProps> = ({
  fromToken,
  toToken,
  fromChain,
  toChain,
  fromAmountFormatted,
  toAmountFormatted,
  quote,
  steps
}) => {
  const operation = quote?.details?.operation || 'swap'
  const isSameChain = fromChain?.id === toChain?.id

  /**
   * formattedSteps transforms backend transaction steps into user-friendly UI steps by:
   * - Tracking active/delayed/completed states
   * - Adding readable action descriptions
   * - Extracting transaction hashes for explorer links
   * - Adding a final Relay processing step
   */
  const { formattedSteps, status } = useMemo(() => {
    if (!steps || steps.length === 0)
      return { formattedSteps: [], status: undefined }

    const result: FormattedStep[] = []
    const executableSteps = steps?.filter(
      (step) => step.items && step.items.length > 0
    )

    // Check if the last executable step has validating_delayed status
    const lastStep = executableSteps[executableSteps.length - 1]
    const lastStepItem = lastStep?.items?.[0]
    const status =
      lastStepItem?.progressState === 'validating_delayed'
        ? 'delayed'
        : undefined

    // Find the current active step
    let activeStepIndex = executableSteps.findIndex((step) =>
      step.items?.some((item) => item.status === 'incomplete')
    )

    // If no active step found (all complete or all incomplete), set to first step
    if (activeStepIndex === -1) {
      activeStepIndex = executableSteps.length > 0 ? 0 : -1
    }

    // Process each step
    executableSteps.forEach((step, index) => {
      const isLastExecutableStep = index === executableSteps.length - 1
      const firstItem = step.items?.[0]
      const progressState = firstItem?.progressState

      // Determine if this step is completed
      let isCompleted =
        step.items?.every((item) => item.status === 'complete') || false

      // For the last executable step, check progressState
      if (isLastExecutableStep && !isCompleted && progressState) {
        if (step.kind === 'transaction' && progressState !== 'confirming') {
          isCompleted = true
        } else if (step.kind === 'signature' && progressState !== 'signing') {
          isCompleted = true
        }
      }

      const isActive = index === activeStepIndex && !isCompleted

      const txHashes =
        step.items?.flatMap((item) => [
          ...(item.txHashes || []),
          ...(item.internalTxHashes || [])
        ]) || []

      const isApproveStep = step.id === 'approve' || step.id === 'approval'

      result.push({
        id: step.id,
        action: getStepActionText(step.id, operation),
        isActive,
        isCompleted,
        progressState,
        txHashes,
        isWalletAction: true,
        chainId: fromToken?.chainId,
        isApproveStep
      })
    })

    const allStepsComplete = result.every((step) => step.isCompleted)

    // Add the appropriate final step
    if (isSameChain) {
      result.push({
        id: 'chain-confirm',
        action: `Relay processes your transaction on ${fromChain?.displayName}`,
        isActive: allStepsComplete,
        isCompleted: false,
        isWalletAction: false,
        chainId: fromChain?.id
      })
    } else {
      result.push({
        id: 'relay-fill',
        action: `Relay fills your order on ${toChain?.displayName}`,
        isActive: allStepsComplete,
        isCompleted: false,
        isWalletAction: false,
        chainId: toChain?.id
      })
    }

    return { formattedSteps: result, status }
  }, [steps, fromToken, toToken, fromChain, toChain, operation])

  return (
    <>
      <Flex
        align="center"
        justify="between"
        direction="column"
        css={{ flexShrink: 0, bp500: { flexDirection: 'row' } }}
      >
        <Flex
          direction="column"
          css={{
            backgroundColor: 'subtle-background-color',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Flex direction="column" align="start" css={{ gap: '1' }}>
            <ChainTokenIcon
              chainId={fromToken?.chainId}
              tokenlogoURI={fromToken?.logoURI}
              css={{ height: 32, width: 32 }}
            />
            <Text color="subtle" style="subtitle2">
              {fromChain?.displayName}
            </Text>
            <Text style="h6" ellipsify css={{ lineHeight: '20px' }}>
              {fromAmountFormatted} {fromToken?.symbol}
            </Text>
          </Flex>
        </Flex>
        <Text
          style="body1"
          css={{
            color: 'gray9',
            p: '0 12px',
            bp400Down: { transform: 'rotate(90deg)' }
          }}
        >
          <FontAwesomeIcon icon={faArrowRight} width={16} />
        </Text>
        <Flex
          direction="column"
          css={{
            backgroundColor: 'subtle-background-color',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Flex direction="column" align="start" css={{ gap: '1' }}>
            <ChainTokenIcon
              chainId={toToken?.chainId}
              tokenlogoURI={toToken?.logoURI}
              css={{ height: 32, width: 32 }}
            />
            <Text color="subtle" style="subtitle2">
              {toChain?.displayName}
            </Text>
            <Text style="h6" ellipsify css={{ lineHeight: '20px' }}>
              {toAmountFormatted} {toToken?.symbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        direction="column"
        css={{
          '--borderColor': 'colors.gray3',
          border: '1px solid var(--borderColor)',
          borderRadius: 12,
          px: '3',
          py: '2',
          gap: '1'
        }}
      >
        {formattedSteps.map((step, index) => (
          <Box key={step.id}>
            <StepRow {...step} />

            {index !== formattedSteps.length - 1 && (
              <Box css={{ height: '14px', pl: '12px', marginTop: '4px' }}>
                <Box
                  css={{
                    width: '1px',
                    height: '100%',
                    backgroundColor: 'gray7'
                  }}
                />
              </Box>
            )}
          </Box>
        ))}

        {status === 'delayed' ? (
          <Flex css={{ p: '3', background: 'amber2', borderRadius: 12 }}>
            <Text style="subtitle3" color="warning">
              Your transaction is delayed. We apologize for the inconvenience.
              Contact support if you need help.
            </Text>
          </Flex>
        ) : null}
      </Flex>
    </>
  )
}

export type StepRowProps = {
  id: string
  action: string
  isActive: boolean
  isCompleted: boolean
  progressState?: string
  txHashes?: { txHash: string; chainId: number }[]
  isWalletAction: boolean
  chainId?: number
  isApproveStep?: boolean
}

export const StepRow: FC<StepRowProps> = ({
  action,
  isActive,
  isCompleted,
  progressState,
  txHashes,
  isWalletAction,
  chainId,
  isApproveStep
}) => {
  const relayClient = useRelayClient()
  const hasTxHash = txHashes && txHashes.length > 0

  return (
    <Flex align="center" justify="between" css={{ width: '100%', gap: '3' }}>
      <Flex align="center" css={{ gap: '2', height: 40 }}>
        <Flex
          css={{
            height: 24,
            width: 24,
            borderRadius: 9999999,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isCompleted
              ? 'green3'
              : isActive
              ? 'primary6'
              : 'gray5',
            color: isCompleted ? 'green11' : isActive ? 'primary5' : 'gray9',
            animation:
              isActive && !isCompleted ? 'pulse-shadow 1.5s infinite' : 'none'
          }}
        >
          {isCompleted ? (
            <FontAwesomeIcon icon={faCheck} width={12} />
          ) : (
            <ChainIcon
              chainId={chainId}
              square={false}
              css={{
                height: 24,
                width: 24,
                borderRadius: 9999999,
                overflow: 'hidden',
                filter: isActive ? 'none' : 'grayscale(100%)'
              }}
            />
          )}
        </Flex>
        <Flex direction="column" css={{ gap: '2px' }}>
          <Flex align="center" css={{ gap: '2' }}>
            <Text style="subtitle2" color={isActive ? undefined : 'subtle'}>
              {action}
            </Text>
            {isWalletAction && (
              <Box
                css={{
                  backgroundColor: 'primary3',
                  borderRadius: 100,
                  px: '2',
                  py: '1'
                }}
              >
                <Text
                  style="subtitle3"
                  css={{
                    color: 'primary11',
                    fontSize: '10px',
                    lineHeight: '12px'
                  }}
                >
                  In Wallet
                </Text>
              </Box>
            )}
          </Flex>

          {isApproveStep && !hasTxHash && !isCompleted && (
            <Anchor
              css={{ fontSize: 12 }}
              href="https://support.relay.link/en/articles/10371133-why-do-i-have-to-approve-a-token"
              target="_blank"
            >
              Why do I have to approve a token?
            </Anchor>
          )}

          {txHashes &&
            txHashes.length > 0 &&
            txHashes.map(({ txHash, chainId }) => {
              const txUrl = getTxBlockExplorerUrl(
                chainId,
                relayClient?.chains,
                txHash
              )
              return (
                <Anchor
                  key={txHash}
                  href={txUrl}
                  target="_blank"
                  css={{
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1'
                  }}
                >
                  Deposit: {truncateAddress(txHash, '...', 6, 4)}{' '}
                  <FontAwesomeIcon icon={faExternalLink} width={14} />
                </Anchor>
              )
            })}
        </Flex>
      </Flex>
    </Flex>
  )
}
