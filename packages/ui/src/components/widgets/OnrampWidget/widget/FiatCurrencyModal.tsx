import { useState, type FC } from 'react'
import { Box, Button, Text } from '../../../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { Modal } from '../../../../components/common/Modal.js'
import type { FiatCurrency } from '../../../../types/index.js'

type Props = {
  fiatCurrency: FiatCurrency
  setFiatCurrency: (fiatCurrency: FiatCurrency) => void
}

const FiatCurrencyModal: FC<Props> = ({ fiatCurrency, setFiatCurrency }) => {
  const [open, setOpen] = useState(false)
  return (
    <Modal
      trigger={
        <Button
          color="white"
          corners="pill"
          css={{
            height: 36,
            minHeight: 36,
            width: 'max-content',
            flexShrink: 0,
            overflow: 'hidden',
            gap: '1',
            display: 'flex',
            alignItems: 'center',
            p: '6px',
            backgroundColor: 'gray2',
            border: 'none',
            _hover: {
              backgroundColor: 'gray3'
            }
          }}
        >
          <img
            alt="currency-icon"
            src={fiatCurrency.icon}
            style={{ width: 16, height: 16, borderRadius: '50%' }}
          />
          <Text style="subtitle2" color="subtle">
            {fiatCurrency.code.toUpperCase()}
          </Text>
          <Box css={{ color: 'gray9', width: 14 }}>
            <FontAwesomeIcon icon={faChevronDown} width={14} />
          </Box>
        </Button>
      }
      open={open}
      onOpenChange={(open) => {
        if (open) {
          // onAnalyticEvent?.(EventNames.ONRAMP_MODAL_OPEN)
        } else {
          // onAnalyticEvent?.(EventNames.ONRAMP_MODAL_CLOSE)
        }
        setOpen(open)
      }}
      css={{
        overflow: 'hidden',
        p: '4',
        maxWidth: '412px !important'
      }}
    >
      <div></div>
    </Modal>
  )
}

export default FiatCurrencyModal
