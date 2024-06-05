import { defaultTheme, type RelayKitTheme } from './RelayKitTheme'

export default function (overrides?: RelayKitTheme): RelayKitTheme {
  return {
    ...defaultTheme,
    ...overrides
  }
}
