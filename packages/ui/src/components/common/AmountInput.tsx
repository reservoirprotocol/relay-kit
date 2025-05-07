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
      value={prefixSymbol ? `${prefixSymbol}${value}` : value}
      onChange={
        inputProps.onChange
          ? inputProps.onChange
          : (e) => {
              let newNumericValue = (e.target as HTMLInputElement).value

              if (prefixSymbol) {
                if (newNumericValue.startsWith(prefixSymbol)) {
                  newNumericValue = newNumericValue.substring(
                    prefixSymbol.length
                  )
                } else if (newNumericValue === '') {
                  // Input field completely cleared. Numeric value is empty.
                  // Prefix will be visually maintained by the `value` prop.
                  // newNumericValue is already correctly ''.
                } else {
                  // Input doesn't start with prefix, but isn't empty.
                  // (e.g., user selected all and typed a new number, or somehow deleted only prefix)
                  // Treat the current input as the new numeric value.
                  // The prefix will be re-applied by the `value` prop on re-render if not typed.
                }
              }

              // Validate and set the numeric part
              const regex = /^[0-9]+(\.[0-9]*)?$/
              if (newNumericValue === '.' || newNumericValue.includes(',')) {
                setValue('0.')
              } else if (
                regex.test(newNumericValue) ||
                newNumericValue === ''
              ) {
                setValue(newNumericValue)
              }
            }
      }
    />
  )
}

export default AmountInput
