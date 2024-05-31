import { CallFees, Execute, RelayChain } from '@reservoir0x/relay-sdk'
import { formatBN, formatDollar } from './numbers'
import { formatUnits, parseUnits } from 'viem'
import { BridgeFee } from '../../types'
import { Currency } from '../../constants/currencies'
import { formatSeconds } from './time'
import { ExecuteBridgeResponse } from '../../hooks/useBridgeQuote'
import { ExecuteSwapResponse } from '../../hooks/useSwapQuote'

export const parseFees = (
  fees: CallFees,
  selectedTo: RelayChain,
  selectedFrom: RelayChain
): BridgeFee[] => {
  const gasFee = BigInt(fees?.gas?.amount ?? 0)
  const formattedGasFee = formatBN(
    gasFee,
    5,
    Number(fees?.gas?.currency?.decimals ?? 18)
  )
  const relayerGasFee = BigInt(fees?.relayerGas?.amount ?? 0)
  const formattedRelayerGas = formatBN(
    relayerGasFee,
    5,
    Number(fees?.relayerGas?.currency?.decimals ?? 18)
  )
  const relayerFee = BigInt(fees?.relayerService?.amount ?? 0)
  const relayerFeeIsReward = relayerFee < 0
  const formattedRelayer = relayerFeeIsReward
    ? formatBN(
        BigInt(fees?.relayerService?.amount?.replace('-', '') ?? 0),
        5,
        Number(fees?.relayerService?.currency?.decimals ?? 18)
      )
    : formatBN(
        relayerFee,
        5,
        Number(fees?.relayerService?.currency?.decimals ?? 18)
      )

  return [
    {
      raw: gasFee,
      formatted: `${formattedGasFee}`,
      usd: fees?.gas?.amountUsd
        ? formatDollar(Number(fees.gas.amountUsd))
        : '0',
      name: `Deposit Gas (${selectedFrom.displayName})`,
      tooltip: null,
      type: 'gas',
      id: 'origin-gas',
      currency: fees?.gas?.currency
    },
    {
      raw: relayerGasFee,
      formatted: `${formattedRelayerGas}`,
      usd: fees?.gas?.amountUsd
        ? formatDollar(Number(fees.relayerGas?.amountUsd))
        : '0',
      name: `Fill Gas (${selectedTo.displayName})`,
      tooltip: null,
      type: 'gas',
      id: 'destination-gas',
      currency: fees?.relayerGas?.currency
    },
    {
      raw: relayerFee,
      formatted: `${relayerFeeIsReward ? '+' : ''}${formattedRelayer}`,
      usd:
        `${relayerFeeIsReward ? '+' : ''}` + fees?.relayerService?.amountUsd
          ? formatDollar(Number(fees?.relayerService?.amountUsd))
          : '0',
      name: relayerFeeIsReward ? 'Reward' : 'Relay Fee',
      tooltip: null,
      type: 'relayer',
      id: 'relayer-fee',
      currency: fees?.relayerService?.currency
    }
  ]
}

export const calculateTransactionFee = (
  fees: CallFees,
  currency: Currency,
  usePermit: boolean,
  gasUsdConversion: number,
  currencyUsdConversion: number,
  amountUsd: number
) => {
  const gasFee = BigInt(fees?.gas?.amount ?? 0)
  const relayerFee = BigInt(fees?.relayer?.amount?.replace('-', '') ?? 0)
  const relayerFeeIsReward = fees?.relayer?.amount?.includes('-')
  const gasCurrencyDecimals = usePermit ? currency.decimals : 18
  const gasUsd =
    gasUsdConversion * Number(formatUnits(gasFee, gasCurrencyDecimals))
  const gasUsdFormatted = formatDollar(gasUsd)
  const relayerUsd =
    currencyUsdConversion * Number(formatUnits(relayerFee, currency.decimals))
  const relayerUsdFormatted = formatDollar(relayerUsd)
  const totalUsd = relayerFeeIsReward
    ? gasUsd + -1 * relayerUsd
    : gasUsd + relayerUsd
  const totalUsdFormatted =
    totalUsd > 0 ? formatDollar(totalUsd) : `+ ${formatDollar(totalUsd * -1)}`
  const priceImpactFees = gasUsd + relayerUsd * (relayerFeeIsReward ? -1 : 1)
  const priceImpact = (priceImpactFees / (amountUsd + priceImpactFees)) * 100
  const priceImpactFormatted = `${priceImpact.toFixed(
    Number.isInteger(priceImpact) ? 0 : 2
  )}%`

  return {
    gasFee,
    relayerFee,
    gasCurrencyDecimals,
    gasUsd,
    gasUsdFormatted,
    relayerUsd,
    relayerUsdFormatted,
    totalUsd,
    totalUsdFormatted,
    priceImpact,
    priceImpactFormatted
  }
}

export const calculateTotalAmount = (
  amount: string,
  currency: Currency,
  currencyUsdConversion: number,
  transactionFees: ReturnType<typeof calculateTransactionFee>
) => {
  // Raw amount is wrong if erc20 not using permit
  const raw =
    parseUnits(amount != '' ? amount : '0', currency.decimals) +
    transactionFees.gasFee +
    transactionFees.relayerFee
  const rawExcludingOriginGas = raw - transactionFees.gasFee
  const formattedExcludingOriginGas = `${formatBN(
    rawExcludingOriginGas,
    5,
    currency.decimals
  )}`

  const amountUsd = currencyUsdConversion * Number(amount)

  return {
    raw,
    usd: formatDollar(
      amountUsd + transactionFees.gasUsd + transactionFees.relayerUsd
    ),
    rawExcludingOriginGas,
    formattedExcludingOriginGas
  }
}

export const calculateRelayerFeeProportionUsd = (
  quote?: ExecuteSwapResponse
) => {
  const usdIn = quote?.details?.currencyIn?.amountUsd
    ? Number(quote.details.currencyIn.amountUsd)
    : null
  const relayerServiceFeeUsd = quote?.fees?.relayerService?.amountUsd
    ? Number(quote.fees.relayerService.amountUsd)
    : null

  if (!usdIn || !relayerServiceFeeUsd) {
    return 0n
  }

  return BigInt(Math.floor((relayerServiceFeeUsd * 100) / usdIn))
}

export const calculateRelayerFeeProportion = (
  totalAmount: { rawExcludingOriginGas: bigint },
  feeBreakdown: BridgeFee[]
) => {
  if (totalAmount.rawExcludingOriginGas > 0n) {
    const relayerFeeRaw =
      feeBreakdown.find((fee) => fee.id === 'relayer-fee')?.raw ?? 0n
    return (relayerFeeRaw * 100n) / totalAmount.rawExcludingOriginGas
  }
  return 0n
}

export const calculateAvailableAmount = (
  currency: Currency,
  usePermit: boolean,
  maxQuote?: ExecuteBridgeResponse,
  maxAmount?: bigint | null
) => {
  const gasWithBuffer = BigInt(
    Math.ceil(Number(maxQuote?.fees?.gas?.amount ?? 0) * 2)
  ) // add 100% buffer to gas price to account for gas fluctuation
  const relayerFee = BigInt(maxQuote?.fees?.relayer?.amount ?? 0)
  const relayerFeeWithBuffer = BigInt(
    Math.ceil(Number(maxQuote?.fees?.relayer?.amount ?? 0) * 1.05)
  ) // add 5% buffer to relayer fee price to account for gas fluctuation

  if (currency.id === 'eth') {
    return maxQuote ? (maxAmount ?? 0n) - gasWithBuffer - relayerFee : null
  } else if (usePermit) {
    return maxQuote ? (maxAmount ?? 0n) - relayerFeeWithBuffer : null
  } else {
    return maxQuote ? (maxAmount ?? 0n) - relayerFee : null
  }
}

export const isHighRelayerServiceFeeUsd = (quote?: ExecuteSwapResponse) => {
  const usdIn = quote?.details?.currencyIn?.amountUsd
    ? Number(quote.details.currencyIn.amountUsd)
    : null
  const relayerServiceFeeUsd = quote?.fees?.relayerService?.amountUsd
    ? Number(quote.fees.relayerService.amountUsd)
    : null

  if (!usdIn || !relayerServiceFeeUsd) {
    return false
  }

  const fivePercentOfUsdIn = (usdIn * 5) / 100
  return relayerServiceFeeUsd >= fivePercentOfUsdIn
}

export const isHighRelayerServiceFee = (
  amount: string,
  currency: Currency,
  quote?: ExecuteBridgeResponse
) => {
  if (!amount) {
    return false
  }
  const relayerServiceFee = BigInt(quote?.fees?.relayerService?.amount ?? 0)
  const debouncedAmountBigInt = parseUnits(amount, currency.decimals)

  const fivePercentOfDebouncedAmount =
    (debouncedAmountBigInt * BigInt(5)) / BigInt(100)
  return relayerServiceFee >= fivePercentOfDebouncedAmount
}

export const extractQuoteId = (steps?: Execute['steps']) => {
  if (
    steps &&
    steps[0] &&
    steps[0].items &&
    steps[0].items[0] &&
    steps[0].items[0].data &&
    steps[0].items[0].data.data
  ) {
    return (steps[0].items[0].data as any)?.data ?? ''
  } else if (
    steps &&
    steps[0] &&
    steps[0].items &&
    steps[0].items[0] &&
    steps[0].items[0].check?.endpoint
  ) {
    const endpoint = steps[0].items[0].check?.endpoint ?? ''
    const matches = endpoint.match(/requestId=([^&]*)/)
    return matches ? matches[1] : null
  }
  return ''
}

export const calculateTimeEstimate = (breakdown?: Execute['breakdown']) => {
  const time =
    breakdown?.reduce((total, breakdown) => {
      return total + (breakdown.timeEstimate ?? 0)
    }, 0) ?? 0
  const formattedTime = formatSeconds(time)

  return {
    time,
    formattedTime
  }
}
