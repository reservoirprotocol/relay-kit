# @reservoir0x/relay-sdk

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
