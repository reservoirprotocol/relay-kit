import { useQuote } from '@reservoir0x/relay-kit-hooks'
import { useMemo, useState, type FC, type ReactNode } from 'react'
import useRelayClient from '../../../hooks/useRelayClient.js'
import { parseUnits } from 'viem'
import { getDeadAddress, type Execute } from '@reservoir0x/relay-sdk'
import { extractDepositAddress } from '../../../utils/quote.js'

export type ChildrenProps = {
  depositAddress?: string
  recipient?: string
  setRecipient?: React.Dispatch<React.SetStateAction<string | undefined>>
  amount: string
  setAmount: React.Dispatch<React.SetStateAction<string>>
}

type OnrampWidgetRendererProps = {
  defaultWalletAddress?: string
  children: (props: ChildrenProps) => ReactNode
}

const OnrampWidgetRenderer: FC<OnrampWidgetRendererProps> = ({ children }) => {
  const [currency, setCurrency] = useState(
    '7560_0x0000000000000000000000000000000000000000'
  )
  const [amount, setAmount] = useState('20')
  const [recipient, setRecipient] = useState<string | undefined>()
  // const [state, setState] = useState<
  //   'CURRENCY_SELECTION' | 'FIAT' | 'DEPOSIT_ADDRESS'
  // >('CURRENCY_SELECTION')
  const client = useRelayClient()
  const destinationChainId = Number(currency.split('_')[0])
  const destinationCurrency = currency.split('_')[1] as string
  const quote = useQuote(
    client ?? undefined,
    undefined,
    {
      originChainId: 1,
      originCurrency: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      destinationChainId: destinationChainId,
      destinationCurrency: destinationCurrency,
      useDepositAddress: true,
      tradeType: 'EXACT_INPUT',
      amount: parseUnits(amount, 6).toString(),
      user: getDeadAddress(),
      recipient
    },
    undefined,
    undefined,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: recipient !== undefined
    }
  )

  const depositAddress = useMemo(
    () => extractDepositAddress(quote?.data?.steps as Execute['steps']),
    [quote]
  )

  return (
    <>
      {children({
        depositAddress,
        recipient,
        setRecipient,
        amount,
        setAmount
      })}
    </>
  )
}

export default OnrampWidgetRenderer
