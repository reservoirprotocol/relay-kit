import type { Execute } from "../../src";

export const postSignatureExtraSteps: Execute['steps'] = [{
  "id": "approve",
  "action": "Extra Steps After Signing",
  "description": "Sign a one-time approval for USDC on permit2",
  "kind": "transaction",
  "requestId": "0xe28f6697997f8945811199f29ab1b29a0123ed5bc3788aefaa1fbd1dbddf756d",
  "items": [
      {
          "status": "incomplete",
          "data": {
              "to": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "data": "0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3000000000000000000000000ffffffffffffffffffffffffffffffffffffffff",
              "value": "0",
              "maxFeePerGas": "13946259706",
              "maxPriorityFeePerGas": "3618812859",
              "chainId": 1
          }
      }
  ]
}]