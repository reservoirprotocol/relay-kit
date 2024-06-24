import { Execute } from "../../src/types";


export const swapWithApproval: Execute = {
  "steps": [
      {
          "id": "authorize1",
          "action": "Sign authorization",
          "description": "Sign to approve swap of USDC for ETH",
          "kind": "signature",
          "items": [
              {
                  "status": "incomplete",
                  "data": {
                      "sign": {
                          "signatureKind": "eip712",
                          "domain": {
                              "name": "Permit2",
                              "chainId": 8453,
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
                                      "token": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
                                      "amount": "3000000"
                                  }
                              ],
                              "nonce": "12476810213816",
                              "deadline": 1721842570,
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
                              "requestId": "0x862f4cb71faa52bcff2b5847a658a9cd3ce73c12ff6204a71d61dd3c702ff93b",
                              "api": "swap"
                          }
                      }
                  },
                  "check": {
                      "endpoint": "/intents/status?requestId=0x862f4cb71faa52bcff2b5847a658a9cd3ce73c12ff6204a71d61dd3c702ff93b",
                      "method": "GET"
                  }
              }
          ]
      }
  ],
  "fees": {
      "gas": {
          "currency": {
              "chainId": 8453,
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
              "chainId": 8453,
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
          "amount": "36412647631700",
          "amountFormatted": "0.0000364126476317",
          "amountUsd": "0.118956"
      },
      "relayerGas": {
          "currency": {
              "chainId": 8453,
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
          "amount": "36412647631700",
          "amountFormatted": "0.0000364126476317",
          "amountUsd": "0.118956"
      },
      "relayerService": {
          "currency": {
              "chainId": 8453,
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
              "chainId": 8453,
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
          "value": "877246254809341",
          "timeEstimate": 30
      }
  ],
  "details": {
      "sender": "0x03508bB71268BBA25ECaCC8F620e01866650532c",
      "recipient": "0x03508bB71268BBA25ECaCC8F620e01866650532c",
      "currencyIn": {
          "currency": {
              "chainId": 8453,
              "address": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
              "symbol": "USDC",
              "name": "USD Coin",
              "decimals": 6,
              "metadata": {
                  "logoURI": "https://ethereum-optimism.github.io/data/USDC/logo.png",
                  "verified": false,
                  "isNative": false
              }
          },
          "amount": "3000000",
          "amountFormatted": "3.0",
          "amountUsd": "3.000330"
      },
      "currencyOut": {
          "currency": {
              "chainId": 8453,
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
          "amount": "877246254809341",
          "amountFormatted": "0.000877246254809341",
          "amountUsd": "2.865876"
      },
      "totalImpact": {
          "usd": "-0.134454",
          "percent": "-4.48"
      },
      "swapImpact": {
          "usd": "-0.015498",
          "percent": "-0.52"
      },
      "rate": "0.00029241541826978033",
      "slippageTolerance": {
          "origin": {
              "usd": "0.000000",
              "value": "0",
              "percent": "0"
          },
          "destination": {
              "usd": "0",
              "value": "0",
              "percent": "0"
          }
      }
  }
}