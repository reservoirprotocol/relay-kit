# @reservoir0x/relay-sdk

## 0.0.0-canary-20240507132251

### Patch Changes

- cac40d2: Sync sdk types

## 0.0.0-canary-20240506220831

### Patch Changes

- 360d61a: Canary build swaps

## 0.0.0-canary-20240506211039

### Patch Changes

- cb154df: Sync api types and rename metadata to details

## 0.0.0-canary-20240506160753

### Patch Changes

- a3d40b2: Add metadata to onProgress callback

## 0.0.0-canary-20240503175152

### Patch Changes

- b70bbd0: Fix swap function

## 0.0.0-canary-20240501214125

### Patch Changes

- 6a5c64c: Fix execute types

## 0.0.0-canary-20240501202525

### Patch Changes

- e5bace4: Canary build

## 0.0.0-canary-20240501181834

### Patch Changes

- bbe88ac: SDK bump

## 0.0.0

### Patch Changes

- e0f2219: Sync types

## 0.0.0-canary-20240429212419

### Patch Changes

- 799c252: Swap action bump

## 0.5.0

### Minor Changes

- 74e12e1: Swap SDK action

## 0.4.0

### Minor Changes

- fc2f8ce: Improve onProgress action callback to be easier to use

### Patch Changes

- 84a2ea8: Update sdk readme

## 0.3.10

### Patch Changes

- 0dbeb4a: Sync api types + add useExactInput parameter to demo

## 0.3.9

### Patch Changes

- 4239703: Remove requestId from Execute type

## 0.3.8

### Patch Changes

- 19019b4: Skip check object if bridge is canonical

## 0.3.7

### Patch Changes

- 96d0990: Sync api types

## 0.3.6

### Patch Changes

- c9d17bb: Sync API types

## 0.3.5

### Patch Changes

- 952b5a6: Add currency id to RelayChain type

## 0.3.4

### Patch Changes

- 8bd3d17: Sync api types

## 0.3.3

### Patch Changes

- 0f291dc: Handle inTxHashes for signature step items

## 0.3.2

### Patch Changes

- a76f067: Add isValidatingSignature to step item

## 0.3.1

### Patch Changes

- f9dff0c: Sync api types and add erc20Currencies to RelayChain

## 0.3.0

### Minor Changes

- e41c632: Update bridge action to use new bridge api + usdc support

### Patch Changes

- a572a48: Handle rainbow wallet bug where txHash of "null" is returned when tx rejected

## 0.2.5

### Patch Changes

- 180d1c7: Omit duplicate types from call and bridge action options
- 4910cbf: Return route breakdown in onProgress callback
- f454345: Remove tx intent trigger api call

## 0.2.4

### Patch Changes

- ade63ae: Sync sdk types with api
- 2624964: Added readme to sdk

## 0.2.3

### Patch Changes

- 10c3e03: Make wallet parameter optional for get quote methods

## 0.2.2

### Patch Changes

- 90e4d58: Add ability to pass in a gasLimit for deposit transactions
- 8a5fdda: Add currentStep and currentStep item to onProgress callback

## 0.2.1

### Patch Changes

- b59c35a: Add getSolverCapacity, getCallQuote, getBridgeQuote methods

## 0.2.0

### Minor Changes

- 53f089b: Handle mismatched chain prior to execution

### Patch Changes

- 0fbab53: Add simplified bridge action for convenience

## 0.1.0

### Minor Changes

- 547425d: Upgrade wagmi, viem and rainbowkit to v2

### Patch Changes

- bad65fe: Automatic source detection

## 0.0.13

### Patch Changes

- 3c6c3fc: Add source attribution parameter to call action

## 0.0.12

### Patch Changes

- 60854a6: Improve chain conversion by using viem chains if available or fallback to api chain data
