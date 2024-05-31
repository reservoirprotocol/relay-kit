import type { RelayKitThemeOverrides, RelayKitTheme } from './RelayKitTheme'
import { sharedThemeConfig } from './RelayKitTheme'

export default function (overrides?: RelayKitThemeOverrides): RelayKitTheme {
  let sharedTheme = sharedThemeConfig(overrides)

  return {
    colors: {
      primaryColor: overrides?.primaryColor ?? '#000'
    },
    ...sharedTheme
  }
}
