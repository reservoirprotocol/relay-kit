import type { FC } from 'react'
import { Flex, Skeleton, Text } from '../primitives/index.js'
import { formatBN } from '../../utils/numbers.js'
import { useAccount } from 'wagmi'

type BalanceDisplayProps = {
  balance?: bigint
  decimals?: number
  symbol?: string
  isLoading: boolean
  hasInsufficientBalance?: boolean
}

export const BalanceDisplay: FC<BalanceDisplayProps> = ({
  balance,
  decimals,
  symbol,
  isLoading,
  hasInsufficientBalance
}) => {
  const { isConnected } = useAccount()
  const compactBalance = Boolean(
    balance && decimals && balance.toString().length - decimals > 4
  )

  return (
    <Flex css={{ height: 18 }}>
      {isConnected ? (
        <>
          {isLoading ? (
            <Skeleton css={{ mt: '6px' }} />
          ) : (
            <Text
              style="subtitle3"
              color={hasInsufficientBalance ? 'red' : 'subtle'}
            >
              Balance: {formatBN(balance ?? 0n, 5, decimals, compactBalance)}{' '}
              {symbol}
            </Text>
          )}
        </>
      ) : null}
    </Flex>
  )
}
