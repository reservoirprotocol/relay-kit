import type { Execute } from "../../src";

export const executeBridgeAuthorize: Execute = {
  "steps": [
      {
          "id": "approve",
          "action": "Confirm transaction in your wallet",
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
      },
      {
          "id": "authorize1",
          "action": "Sign authorization",
          "description": "Sign to approve swap of USDC for ETH",
          "kind": "signature",
          "requestId": "0xe28f6697997f8945811199f29ab1b29a0123ed5bc3788aefaa1fbd1dbddf756d",
          "items": [
              {
                  "status": "incomplete",
                  "data": {
                      "sign": {
                          "signatureKind": "eip712",
                          "domain": {
                              "name": "Permit2",
                              "chainId": 1,
                              "verifyingContract": "0x000000000022D473030F116dDEE9F6B43aC78BA3"
                          },
                          "types": {
                              "PermitBatchWitnessTransferFrom": [
                                  {
                                      "name": "permitted",
                                      "type": "TokenPermissions[]"
                                  },
                                  {
                                      "name": "spender",
                                      "type": "address"
                                  },
                                  {
                                      "name": "nonce",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "deadline",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "witness",
                                      "type": "RelayerWitness"
                                  }
                              ],
                              "TokenPermissions": [
                                  {
                                      "name": "token",
                                      "type": "address"
                                  },
                                  {
                                      "name": "amount",
                                      "type": "uint256"
                                  }
                              ],
                              "RelayerWitness": [
                                  {
                                      "name": "relayer",
                                      "type": "address"
                                  }
                              ]
                          },
                          "value": {
                              "permitted": [
                                  {
                                      "token": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                                      "amount": "3455003001"
                                  }
                              ],
                              "nonce": "94994237970870",
                              "deadline": 1721938329,
                              "spender": "0x00000000bb6dd3b0032d930f72cac8e56166d93c",
                              "witness": {
                                  "relayer": "0xf70da97812cb96acdf810712aa562db8dfa3dbef"
                              }
                          },
                          "primaryType": "PermitBatchWitnessTransferFrom"
                      },
                      "post": {
                          "endpoint": "/execute/permits",
                          "method": "POST",
                          "body": {
                              "kind": "eip3009",
                              "requestId": "0xe28f6697997f8945811199f29ab1b29a0123ed5bc3788aefaa1fbd1dbddf756d",
                              "api": "swap"
                          }
                      }
                  },
                  "check": {
                      "endpoint": "/intents/status?requestId=0xe28f6697997f8945811199f29ab1b29a0123ed5bc3788aefaa1fbd1dbddf756d",
                      "method": "GET"
                  }
              }
          ]
      }
  ],
  "fees": {
      "gas": {
          "currency": {
              "chainId": 1,
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "ETH",
              "name": "Ether",
              "decimals": 18,
              "metadata": {
                  "logoURI": "https://assets.relay.link/icons/1/light.png",
                  "verified": true,
                  "isNative": true
              }
          },
          "amount": "0",
          "amountFormatted": "0.0",
          "amountUsd": "0.000000"
      },
      "relayer": {
          "currency": {
              "chainId": 1,
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "ETH",
              "name": "Ether",
              "decimals": 18,
              "metadata": {
                  "logoURI": "https://assets.relay.link/icons/1/light.png",
                  "verified": true,
                  "isNative": true
              }
          },
          "amount": "3796595541743919",
          "amountFormatted": "0.003796595541743919",
          "amountUsd": "12.994570"
      },
      "relayerGas": {
          "currency": {
              "chainId": 1,
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "ETH",
              "name": "Ether",
              "decimals": 18,
              "metadata": {
                  "logoURI": "https://assets.relay.link/icons/1/light.png",
                  "verified": true,
                  "isNative": true
              }
          },
          "amount": "3796595541743919",
          "amountFormatted": "0.003796595541743919",
          "amountUsd": "12.994570"
      },
      "relayerService": {
          "currency": {
              "chainId": 1,
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "ETH",
              "name": "Ether",
              "decimals": 18,
              "metadata": {
                  "logoURI": "https://assets.relay.link/icons/1/light.png",
                  "verified": true,
                  "isNative": true
              }
          },
          "amount": "0",
          "amountFormatted": "0.0",
          "amountUsd": "0.000000"
      },
      "app": {
          "currency": {
              "chainId": 1,
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "ETH",
              "name": "Ether",
              "decimals": 18,
              "metadata": {
                  "logoURI": "https://assets.relay.link/icons/1/light.png",
                  "verified": true,
                  "isNative": true
              }
          },
          "amount": "0",
          "amountFormatted": "0.0",
          "amountUsd": "0.000000"
      }
  },
  "breakdown": [
      {
          "value": "3000000",
          "timeEstimate": 30
      }
  ],
  "details": {
      "sender": "0x03508bB71268BBA25ECaCC8F620e01866650532c",
      "recipient": "0xf70da97812cb96acdf810712aa562db8dfa3dbef",
      "currencyIn": {
          "currency": {
              "chainId": 1,
              "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "symbol": "USDC",
              "name": "USDCoin",
              "decimals": 6,
              "metadata": {
                  "logoURI": "https://ethereum-optimism.github.io/data/USDC/logo.png",
                  "verified": false,
                  "isNative": false
              }
          },
          "amount": "3455003001",
          "amountFormatted": "3455.003001",
          "amountUsd": "3456.108602"
      },
      "currencyOut": {
          "currency": {
              "chainId": 7777777,
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "ETH",
              "name": "Ether",
              "decimals": 18,
              "metadata": {
                  "logoURI": "https://assets.relay.link/icons/1/light.png",
                  "verified": true,
                  "isNative": true
              }
          },
          "amount": "3000000",
          "amountFormatted": "0.000000000003",
          "amountUsd": "0.000000"
      },
      "totalImpact": {
          "usd": "-3456.108602",
          "percent": "-100.00"
      },
      "swapImpact": {
          "usd": "-3443.114032",
          "percent": "-99.62"
      },
      "rate": "8.683060475292479e-16",
      "slippageTolerance": {
          "origin": {
              "usd": "0.000000",
              "value": "0",
              "percent": "0"
          },
          "destination": {
              "usd": "0.000000",
              "value": "0",
              "percent": "0"
          }
      }
  }
}