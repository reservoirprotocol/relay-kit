import type { paths } from '@reservoir0x/relay-sdk'
import Anchor from '../primitives/Anchor.js'

type RefundReasonProps = {
  reasonCode?: string
}
const RefundReason: React.FC<RefundReasonProps> = ({ reasonCode }) => {
  if (reasonCode && reasonCode != 'N/A') {
    switch (reasonCode) {
      case 'SLIPPAGE': {
        return (
          <>
            Your transaction has been refunded because the market price shifted
            more than the allowed slippage.{' '}
            <Anchor
              href="https://docs.relay.link/what-is-relay#intercom"
              target="_blank"
            >
              Contact support
            </Anchor>{' '}
            if you have any further questions.{' '}
          </>
        )
      }
      case 'AMOUNT_TOO_LOW_TO_REFUND': {
        return (
          <>
            Your transaction amount is insufficient to cover the gas cost for an
            automatic refund. Please{' '}
            <Anchor
              href="https://docs.relay.link/what-is-relay#intercom"
              target="_blank"
            >
              contact support
            </Anchor>{' '}
            if you have any further questions.{' '}
          </>
        )
      }
      case 'DEPOSIT_ADDRESS_MISMATCH':
      case 'DEPOSIT_CHAIN_MISMATCH':
      case 'INSUFFICIENT_BALANCE_FOR_REFUND':
      case 'UNKNOWN':
      default: {
        return (
          <>
            It looks like an unknown issue occurred during the transaction.
            Please{' '}
            <Anchor
              href="https://docs.relay.link/what-is-relay#intercom"
              target="_blank"
            >
              contact support
            </Anchor>{' '}
            if you have any further questions.{' '}
          </>
        )
      }
    }
  }
}

export default RefundReason
