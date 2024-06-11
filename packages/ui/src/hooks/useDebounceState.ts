import { useMemo, useRef, useState } from 'react'
import {
  type DebouncedState,
  useDebounceValue,
  useDebounceCallback
} from 'usehooks-ts'

type Params<T> = Parameters<typeof useDebounceValue>

export default function useDebounceState<T>(
  initialValue: Params<T>[0],
  delay: Params<T>[1],
  options?: Params<T>[2]
): {
  value: T
  debouncedValue: T
  setValue: (value: T) => void
  setDebouncedValue: (value: T) => void
  debouncedControls: DebouncedState<(value: T) => void>
} {
  const memoOptions = useMemo(() => {
    return options
  }, [options])
  const eq = memoOptions?.equalityFn ?? ((left: T, right: T) => left === right)
  const unwrappedInitialValue =
    initialValue instanceof Function ? initialValue() : initialValue
  const [debouncedValue, setDebouncedValue] = useState<T>(unwrappedInitialValue)
  const [value, setValue] = useState<T>(unwrappedInitialValue)
  const previousValueRef = useRef<T | undefined>(unwrappedInitialValue)

  const updateDebouncedValue = useDebounceCallback(
    setDebouncedValue,
    delay,
    memoOptions
  )

  // Update the debounced value if the initial value changes
  if (!eq(previousValueRef.current as T, unwrappedInitialValue)) {
    updateDebouncedValue(unwrappedInitialValue)
    previousValueRef.current = unwrappedInitialValue
  }

  return {
    value,
    debouncedValue,
    setValue: (value: T) => {
      updateDebouncedValue.cancel()
      setValue(value)
      updateDebouncedValue(value)
    },
    setDebouncedValue: (value: T) => {
      updateDebouncedValue.cancel()
      updateDebouncedValue(value)
    },
    debouncedControls: updateDebouncedValue
  }
}
