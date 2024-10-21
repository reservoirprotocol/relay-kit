# @reservoir0x/relay-kit-ui

## 2.1.9

### Patch Changes

- 29bb388: Added keyboard navigation to token selector

## 2.1.8

### Patch Changes

- ac81750: Add input and output amount to max capacity event

## 2.1.7

### Patch Changes

- 2134530: Replace exact_output with expected_output tradeType
- Updated dependencies [2134530]
  - @reservoir0x/relay-sdk@1.3.4
  - @reservoir0x/relay-kit-hooks@1.3.4

## 2.1.6

### Patch Changes

- cea3f43: Fix ux issues with canonical route selector

## 2.1.5

### Patch Changes

- af05332: Improve price impact, handle no instant liquidity ux

## 2.1.4

### Patch Changes

- fbe5a41: Improvements on the canonical fallback ux

## 2.1.3

### Patch Changes

- 25d9c9a: Fix disabled token selector background and issue with resetting canonical route

## 2.1.2

### Patch Changes

- 9b0319e: Remove hardcoded canonical currencies

## 2.1.1

### Patch Changes

- d7a2ced: Fix canonical check amount, disable token selector when one option available

## 2.1.0

### Minor Changes

- 466cf46: Implement canonical+ support into SwapWidget, remove ChainWidget

## 2.0.8

### Patch Changes

- e3044ff: Fix token selector balance display

## 2.0.7

### Patch Changes

- 49cd085: Fix swap modal closing when dynamic embedded wallet tx modal is prompted and clicked on

## 2.0.6

### Patch Changes

- Updated dependencies [3f88d12]
  - @reservoir0x/relay-sdk@1.3.3
  - @reservoir0x/relay-kit-hooks@1.3.3

## 2.0.5

### Patch Changes

- e0b311d: Patches fixes for Solana + multi wallet dropdown ui

## 2.0.4

### Patch Changes

- e763551: Fix minor CustomAddressModal bugs

## 2.0.3

### Patch Changes

- 277bfc5: Fix wallet switching in ChainWidget, fix sdk convert viem chain to RelayChain helper
- 1edca7c: Removed max button when Solana balance is less than minimum buffer.
- Updated dependencies [277bfc5]
  - @reservoir0x/relay-sdk@1.3.2
  - @reservoir0x/relay-kit-hooks@1.3.2

## 2.0.2

### Patch Changes

- 78e5d13: Added a buffer of 0.02 minimum when selecting max for a Solana balance
- b1526cb: Fix solana custom address prompt

## 2.0.1

### Patch Changes

- dc387e3: Fix solana balance cached after swapping

## 2.0.0

### Major Changes

- 2c38afe: Add solana ui support in SwapWidget

### Patch Changes

- Updated dependencies [2c38afe]
  - @reservoir0x/relay-sdk@1.3.1
  - @reservoir0x/relay-kit-hooks@1.3.1

## 1.4.1

### Patch Changes

- c5ed1d8: Improve high price impact copy

## 1.4.0

### Minor Changes

- a8215cf: Abstract txs in Adapted Wallet + new Solana Adapter

### Patch Changes

- Updated dependencies [a8215cf]
  - @reservoir0x/relay-kit-hooks@1.3.0
  - @reservoir0x/relay-sdk@1.3.0

## 1.3.20

### Patch Changes

- ae0dd9b: Remove resetting of chain filter when token selector is closed
- 10a4d30: Fix modal's "x" button size and alignment
- 41feac9: Expand support for svm chains when setting addresses
- Updated dependencies [41feac9]
  - @reservoir0x/relay-sdk@1.2.2
  - @reservoir0x/relay-kit-hooks@1.2.5

## 1.3.19

### Patch Changes

- a93ae37: Chain selector ux tweaks

## 1.3.18

### Patch Changes

- 2d33c4a: Update high price impact warning logic
- 128127f: Update swap widget padding and box shadow

## 1.3.17

### Patch Changes

- 9fe399d: Fix conversion rate formatting bug

## 1.3.16

### Patch Changes

- 7079727: Fix ui overflow on transaction modal
- 32c533e: Allow fetching solana quotes with no custom address

## 1.3.15

### Patch Changes

- e6f3183: Fix search by chain displayName
- 5caf19b: Update Swapping CTA

## 1.3.14

### Patch Changes

- 2a11467: Small token selector bug fixes

## 1.3.13

### Patch Changes

- f409525: Fix token selector chain filter bug

## 1.3.12

### Patch Changes

- 6001f8d: Use default token list when chain is filtered

## 1.3.11

### Patch Changes

- 2c6ead0: Chain selector improvements

## 1.3.10

### Patch Changes

- 9b623c2: Add styling support for undefined tokens in new swap widget

## 1.3.9

### Patch Changes

- 7a084fa: New swap widget ui
- Updated dependencies [7a084fa]
  - @reservoir0x/relay-kit-hooks@1.2.4
  - @reservoir0x/relay-sdk@1.2.1

## 1.3.8

### Patch Changes

- 9e14a17: Better handling of transaction in flight and post transaction ui, handle refund status when polling for transaction success
- Updated dependencies [9e14a17]
  - @reservoir0x/relay-sdk@1.2.0
  - @reservoir0x/relay-kit-hooks@1.2.3

## 1.3.7

### Patch Changes

- Updated dependencies [78c6ed0]
  - @reservoir0x/relay-sdk@1.1.2
  - @reservoir0x/relay-kit-hooks@1.2.2

## 1.3.6

### Patch Changes

- 7a1a4c7: Fix analytics in TransactionModal

## 1.3.5

### Patch Changes

- 7d3f84d: Update balance display for solana

## 1.3.4

### Patch Changes

- 785b732: Update solana token selector logic

## 1.3.3

### Patch Changes

- 3ae5fee: Prevent switch token button in swap widget when swapping to solana token

## 1.3.2

### Patch Changes

- 98bf004: Reduce swap conversion rate from 5 decimals to 2 decimals
- 4473144: Link out to to chain block explorer in review quote ux
- 6363308: Handle 0s time estimate
- 35d5e43: Improve custom wallet address modal ux
- 2cd9327: Improve tx error messaging
- b940e97: Reset custom address when switching to token from solana to evm chain
- a42142d: Price Impact ui tweaks
- Updated dependencies [28ed450]
  - @reservoir0x/relay-sdk@1.1.1
  - @reservoir0x/relay-kit-hooks@1.2.1

## 1.3.1

### Patch Changes

- df71a3b: Support Solana deposits in Swap widget

## 1.3.0

### Minor Changes

- b9db008: Upgrade /requests api to /requests/v2

### Patch Changes

- 4cd7401: ChainWidget: Fix copy in SwapRouteSelector
- Updated dependencies [b9db008]
  - @reservoir0x/relay-kit-hooks@1.2.0

## 1.2.0

### Minor Changes

- 105d1b8: Switch from execute/swap to quote api

### Patch Changes

- Updated dependencies [c158099]
- Updated dependencies [105d1b8]
  - @reservoir0x/relay-sdk@1.1.0
  - @reservoir0x/relay-kit-hooks@1.1.0

## 1.1.18

### Patch Changes

- efd44d6: Add price impact warning to review quote ux
- b342c8d: Add support for iconUrl chain icon override
- Updated dependencies [b342c8d]
  - @reservoir0x/relay-sdk@1.0.13
  - @reservoir0x/relay-kit-hooks@1.0.19

## 1.1.17

### Patch Changes

- f66e0f5: Fix safari modal animation flickering bug
- 87239fa: Add defaultExternalChainToken to Chain Widget

## 1.1.16

### Patch Changes

- Updated dependencies [ec9b20f]
  - @reservoir0x/relay-sdk@1.0.12
  - @reservoir0x/relay-kit-hooks@1.0.18

## 1.1.15

### Patch Changes

- Updated dependencies [92b9c71]
  - @reservoir0x/relay-sdk@1.0.11
  - @reservoir0x/relay-kit-hooks@1.0.17

## 1.1.14

### Patch Changes

- fac3415: Fix chain widget testnet configuration
- Updated dependencies [fac3415]
  - @reservoir0x/relay-kit-hooks@1.0.16

## 1.1.13

### Patch Changes

- 5acf10e: Fix swap widget cta bug

## 1.1.12

### Patch Changes

- 23b528c: Remove compact formatting from review quote

## 1.1.11

### Patch Changes

- 00da309: Decouple dune balance loading from token selector

## 1.1.10

### Patch Changes

- Add review quote step, refactor modal renderers
- af694ab: Fix dollar formatting sub 0 and price impact spacing
- e231382: Color coding price impact
- Updated dependencies
- Updated dependencies [2d22eec]
  - @reservoir0x/relay-kit-hooks@1.0.15
  - @reservoir0x/relay-sdk@1.0.10

## 1.1.9

### Patch Changes

- b3432f4: Fix dropdown item hover color

## 1.1.8

### Patch Changes

- 3648ec3: Better contextualize actions based on operation
- ea3e6c5: Only show fill time on success page if sub 10s
- d5b3f82: Export TokenSelector component
- Updated dependencies [3648ec3]
- Updated dependencies [be74a6a]
  - @reservoir0x/relay-sdk@1.0.9
  - @reservoir0x/relay-kit-hooks@1.0.14

## 1.1.7

### Patch Changes

- 7445bbf: Reset canonical selection on ChainWidget unless supported

## 1.1.6

### Patch Changes

- 433ca57: Add txHashes to success and error events
- 7c8fb89: Add transaction validating event

## 1.1.5

### Patch Changes

- 4cf2285: Update chain display in token select ui

## 1.1.4

### Patch Changes

- 02c5ea0: Sort token selector by total value usd and balance

## 1.1.3

### Patch Changes

- 643c6a6: Add success screen for canonical
- Updated dependencies [1e83361]
  - @reservoir0x/relay-sdk@1.0.8
  - @reservoir0x/relay-kit-hooks@1.0.13

## 1.1.2

### Patch Changes

- eae9b4d: ChainWidget Canonical functionality

## 1.1.1

### Patch Changes

- 3f2bd68: Remove log

## 1.1.0

### Minor Changes

- 0384db0: Refactor SwapWidget and add new ChainWidget for deposit/withdraw ux

### Patch Changes

- 4335c35: Add tests and fix global axios instance
- Updated dependencies [4335c35]
  - @reservoir0x/relay-kit-hooks@1.0.12
  - @reservoir0x/relay-sdk@1.0.7

## 1.0.16

### Patch Changes

- Updated dependencies [5c1a210]
  - @reservoir0x/relay-kit-hooks@1.0.11

## 1.0.15

### Patch Changes

- Updated dependencies [ec5e68e]
  - @reservoir0x/relay-kit-hooks@1.0.10

## 1.0.14

### Patch Changes

- f7f014b: Pass source in widget

## 1.0.13

### Patch Changes

- d264b99: Fix capabilities check when coinbase wallet connected
- 5184197: Improve post transaction polling to increase speed
- Updated dependencies [5184197]
  - @reservoir0x/relay-sdk@1.0.6
  - @reservoir0x/relay-kit-hooks@1.0.9

## 1.0.12

### Patch Changes

- 4758845: Update swap time icon color code
- 5a6f8ca: Hide balance column in TokenSelector when account is not connected
- d2c94a3: Disable useCapabilities except for on coinbase wallet

## 1.0.11

### Patch Changes

- ffb9ebe: Fix button color when token selector is locked
- 1945809: Move wallet chain id check to further in the flow
- Updated dependencies [1945809]
  - @reservoir0x/relay-kit-hooks@1.0.8
  - @reservoir0x/relay-sdk@1.0.5

## 1.0.10

### Patch Changes

- b093883: Add lock token params to swap widget"

## 1.0.9

### Patch Changes

- 577658a: Update powered by reservoir to use logo
- 525e523: Fix total price impact copy
- 813be48: Add onSuccess and onError callbacks for SwapWidget
- Updated dependencies [813be48]
  - @reservoir0x/relay-kit-hooks@1.0.7

## 1.0.8

### Patch Changes

- f0ecb82: Allow same currency swapping when different recipient
- 7361f60: Fix RelayKitProvider initialization
- Updated dependencies [6b5015b]
  - @reservoir0x/relay-sdk@1.0.4
  - @reservoir0x/relay-kit-hooks@1.0.6

## 1.0.7

### Patch Changes

- 5759936: Add app fee to breakdown ui
- 0c7e56c: Fix info icon alignment
- a3d4c06: Fix input icon position
- 0a8325b: Filter token search by configured tokens
- Updated dependencies [772b657]
- Updated dependencies [2922c29]
  - @reservoir0x/relay-sdk@1.0.3
  - @reservoir0x/relay-kit-hooks@1.0.5

## 1.0.6

### Patch Changes

- 7aa524c: Add app name and fees to RelayKitProvider options
- 9ad0dda: Add token change callbacks
- 7a073f8: Fix theme override selector

## 1.0.5

### Patch Changes

- ce46e72: Strip layers from generated ui kit stylesheet
- Updated dependencies [ce46e72]
  - @reservoir0x/relay-design-system@0.0.2
  - @reservoir0x/relay-kit-hooks@1.0.4
  - @reservoir0x/relay-sdk@1.0.2

## 1.0.4

### Patch Changes

- 592feb1: Make tanstack query a peer dependency
- Updated dependencies [592feb1]
  - @reservoir0x/relay-kit-hooks@1.0.3

## 1.0.3

### Patch Changes

- ac60282: Make wagmi a peer dependency

## 1.0.2

### Patch Changes

- 2c6d3da: Fix esm import errors
- Updated dependencies [2c6d3da]
  - @reservoir0x/relay-kit-hooks@1.0.2

## 1.0.1

### Patch Changes

- 4a55654: Fix deploy script
- Updated dependencies [4a55654]
  - @reservoir0x/relay-design-system@0.0.1
  - @reservoir0x/relay-kit-hooks@1.0.1
  - @reservoir0x/relay-sdk@1.0.1

## 1.0.0

### Major Changes

- ba72406: Refactor SDK to simplify, add ui packages

### Patch Changes

- Updated dependencies [ba72406]
  - @reservoir0x/relay-design-system@0.0.0
  - @reservoir0x/relay-kit-hooks@1.0.0
  - @reservoir0x/relay-sdk@1.0.0
