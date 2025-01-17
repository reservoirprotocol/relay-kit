import { useQuote } from '@reservoir0x/relay-kit-hooks'
import { useState, type FC, type ReactNode } from 'react'
import useRelayClient from '../../../hooks/useRelayClient.js'
import { parseUnits } from 'viem'

export type ChildrenProps = {
  depositAddress?: string
  recipient?: string
  setRecipient?: React.Dispatch<React.SetStateAction<string | undefined>>
}

type OnrampWidgetRendererProps = {
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
      user: '0x000000000000000000000000000000000000dead'
    },
    undefined,
    undefined,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  )

  const depositAddress = quote?.data?.steps?.find(
    (step) => step.depositAddress
  )?.depositAddress

  return (
    <>
      {children({
        depositAddress,
        recipient,
        setRecipient
      })}
    </>
  )
}

export default OnrampWidgetRenderer
