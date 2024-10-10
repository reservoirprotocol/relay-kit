import { useEffect, useRef } from 'react'

export default <T>(
  value: T,
  enabled: boolean,
  onChange: (value: T) => void
) => {
  const ref = useRef<T>()

  useEffect(() => {
    if (enabled && ref.current !== value) {
      ref.current = value
      onChange(value)
    }
  }, [value, enabled, onChange])

  return ref.current
}
