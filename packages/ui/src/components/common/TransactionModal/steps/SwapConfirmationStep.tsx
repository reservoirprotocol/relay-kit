import { type FC } from 'react'
import { Button, Flex, Text, ChainTokenIcon } from '../../../primitives'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LoadingSpinner } from '../../LoadingSpinner'
import { type Token } from '../../../../types'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'

type SwapConfirmationStepProps = {
  fromToken?: Token
  toToken?: Token
  fromAmountFormatted: string
  toAmountFormatted: string
}

export const SwapConfirmationStep: FC<SwapConfirmationStepProps> = ({
  fromToken,
  toToken,
  fromAmountFormatted,
  toAmountFormatted
}) => {
  return (
    <>
      <Flex
        align="center"
        justify="between"
        direction="column"
        css={{ bp500: { flexDirection: 'row' } }}
      >
        <Flex
          direction="column"
          css={{
            backgroundColor: 'gray1',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Text style="subtitle2" color="subtle">
            From
          </Text>

          <Flex align="center" css={{ gap: '2', cursor: 'pointer' }}>
            <ChainTokenIcon
              chainId={fromToken?.chainId}
              tokenlogoURI={fromToken?.logoURI}
              css={{ height: 20, width: 20 }}
            />

            <Text style="subtitle1" ellipsify>
              {fromAmountFormatted} {fromToken?.symbol}
            </Text>
          </Flex>
        </Flex>
        <Text
          style="body1"
          css={{
            color: 'gray9',
            p: '0 16px',
            bp400Down: { transform: 'rotate(90deg)' }
          }}
        >
          <FontAwesomeIcon icon={faArrowRight} width={16} />
        </Text>
        <Flex
          direction="column"
          css={{
            backgroundColor: 'gray1',
            p: '12px 16px',
            borderRadius: 12,
            gap: 1,
            width: '100%'
          }}
        >
          <Text style="subtitle2" color="subtle">
            To
          </Text>
          <Flex align="center" css={{ gap: '2', cursor: 'pointer' }}>
            <ChainTokenIcon
              chainId={toToken?.chainId}
              tokenlogoURI={toToken?.logoURI}
              css={{ height: 20, width: 20 }}
            />
            <Text style="subtitle1" ellipsify>
              {toAmountFormatted} {toToken?.symbol}
            </Text>
          </Flex>
        </Flex>
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
        Waiting for Wallet Confirmation
      </Button>
    </>
  )
}
