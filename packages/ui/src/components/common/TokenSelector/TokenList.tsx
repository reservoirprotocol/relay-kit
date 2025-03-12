import { type FC } from 'react'
import {
  Flex,
  Text,
  Skeleton,
  ChainTokenIcon,
  AccessibleListItem,
  Box,
  Button
} from '../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { formatBN, formatDollar } from '../../../utils/numbers.js'
import { truncateAddress } from '../../../utils/truncate.js'
import type { EnhancedToken } from '../../../hooks/useEnhancedTokensList.js'

type TokenListProps = {
  title: string
  tokens: EnhancedToken[]
  isLoading: boolean
  isLoadingBalances?: boolean
}

export const TokenList: FC<TokenListProps> = ({
  title,
  tokens,
  isLoading,
  isLoadingBalances
}) => {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, index) => (
          <Flex
            key={index}
            align="center"
            css={{ gap: '2', p: '2', width: '100%' }}
          >
            <Skeleton
              css={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0
              }}
            />
            <Flex direction="column" css={{ gap: '2px', flexGrow: 1 }}>
              <Skeleton css={{ width: '60%', height: 16 }} />
              <Skeleton css={{ width: '40%', height: 16 }} />
            </Flex>
          </Flex>
        ))}
      </>
    )
  }

  if (tokens.length > 0)
    return (
      <Flex direction="column" css={{ gap: '1', width: '100%' }}>
        <Text style="subtitle3" color="subtle">
          {title}
        </Text>
        {tokens.map((token) => {
          const value = `${token.chainId}:${token.address}`
          const compactBalance = Boolean(
            token.balance &&
              token.decimals &&
              token.balance.toString().length - token.decimals > 4
          )

          return (
            <AccessibleListItem value={value} key={value} asChild>
              <Button
                color="ghost"
                css={{
                  gap: '2',
                  cursor: 'pointer',
                  px: '2',
                  py: '2',
                  transition: 'backdrop-filter 250ms linear',
                  _hover: {
                    backgroundColor: 'gray/10'
                  },
                  flexShrink: 0,
                  alignContent: 'center',
                  display: 'flex',
                  width: '100%',
                  '--focusColor': 'colors.focus-color',
                  _focusVisible: {
                    boxShadow: 'inset 0 0 0 2px var(--focusColor)'
                  },
                  '&[data-state="on"]': {
                    boxShadow: 'inset 0 0 0 2px var(--focusColor)'
                  },
                  _active: {
                    boxShadow: 'inset 0 0 0 2px var(--focusColor)'
                  },
                  _focusWithin: {
                    boxShadow: 'inset 0 0 0 2px var(--focusColor)'
                  },
                  scrollSnapAlign: 'start'
                }}
              >
                <ChainTokenIcon
                  chainId={token.chainId}
                  tokenlogoURI={token.logoURI}
                  css={{ width: 32, height: 32 }}
                />
                <Flex direction="column" align="start" css={{ gap: '2px' }}>
                  <Text
                    style="h6"
                    ellipsify
                    css={{
                      maxWidth: token.balance ? '112px' : '200px'
                    }}
                  >
                    {token.symbol}
                  </Text>
                  <Flex align="center" css={{ gap: '1' }}>
                    <Text
                      style="subtitle3"
                      color="subtle"
                      ellipsify
                      css={{ maxWidth: 70 }}
                    >
                      {token.name}
                    </Text>

                    <Text style="subtitle3" color="subtle">
                      {truncateAddress(token.address)}
                    </Text>

                    {!token.verified ? (
                      <Box css={{ color: 'gray8' }}>
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          width={14}
                          height={14}
                        />
                      </Box>
                    ) : null}
                  </Flex>
                </Flex>

                {(token.balance || isLoadingBalances) && (
                  <Flex
                    direction="column"
                    align="end"
                    css={{ gap: '2px', ml: 'auto' }}
                  >
                    {isLoadingBalances ? (
                      <>
                        <Skeleton css={{ ml: 'auto', width: 60 }} />
                        <Skeleton css={{ ml: 'auto', width: 60 }} />
                      </>
                    ) : (
                      <>
                        <Text style="h6">
                          {formatBN(
                            token.balance!.amount,
                            4,
                            token.decimals,
                            compactBalance
                          )}
                        </Text>
                        {token.balance?.value_usd &&
                          token.balance.value_usd > 0 && (
                            <Text style="subtitle3" color="subtle">
                              {formatDollar(token.balance.value_usd)}
                            </Text>
                          )}
                      </>
                    )}
                  </Flex>
                )}
              </Button>
            </AccessibleListItem>
          )
        })}
      </Flex>
    )
}
