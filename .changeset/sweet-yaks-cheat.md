---
'@reservoir0x/relay-kit-hooks': minor
'@reservoir0x/relay-kit-ui': minor
'@reservoir0x/relay-sdk': patch
---

Breaking Changes:

- `relay-kit-hooks`: Updated `useTokenLists` hook to use `/currencies/v2` API with new response structure
- `relay-kit-ui`: Redesigned token selector component with improved architecture
  - Removed chain selector in favor of unified token selector component
  - Removed `defaultToToken` and `defaultFromToken` props
  - Added `toToken`, `setToToken`, `fromToken`, `setFromToken` props
  - Added `disableInputAutoFocus` and `popularChainIds` configuration options

These changes improve token selection UX, provide better state management, and enable more flexible chain configuration.
