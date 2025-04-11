import type { ComponentPropsWithoutRef, FC } from 'react'
import { Input } from '../primitives/index.js'

type Props = {
  value: string
  setValue: (value: string) => void
  prefixSymbol?: string
} & ComponentPropsWithoutRef<typeof Input>

const AmountInput: FC<Props> = ({
  value,
  setValue,
  prefixSymbol,
  ...inputProps
}) => {
  return (
    <Input
      {...inputProps}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      pattern="^[0-9]+(\.[0-9]*)?$"
      ellipsify
      size="large"
      className="ph-no-capture"
      css={{
        width: '100%',
        background: 'none',
        backgroundColor: 'transparent',
        fontWeight: '600',
        fontSize: 32,
        px: '0 !important',
        py: '1',
        _focus: {
          boxShadow: 'none',
          outline: 'none'
        },
        _placeholder: {
          color: 'gray12'
        },
        ...inputProps.css
      }}
      placeholder={inputProps.placeholder ?? '0'}
      value={prefixSymbol && value ? `${prefixSymbol}${value}` : value}
      onChange={
        inputProps.onChange
          ? inputProps.onChange
          : (e) => {
              let inputValue = (e.target as HTMLInputElement).value

              if (prefixSymbol && inputValue.startsWith(prefixSymbol)) {
                inputValue = inputValue.substring(prefixSymbol.length)
              } else if (prefixSymbol && inputValue === prefixSymbol) {
                inputValue = ''
              }

              const regex = /^[0-9]+(\.[0-9]*)?$/
              if (inputValue === '.' || inputValue.includes(',')) {
                setValue('0.')
              } else if (regex.test(inputValue) || inputValue === '') {
                setValue(inputValue)
              }
            }
      }
    />
  )
}

export default AmountInput
