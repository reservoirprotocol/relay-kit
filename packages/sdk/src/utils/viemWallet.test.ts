import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adaptViemWallet } from './viemWallet'
import type { WalletClient } from 'viem'
import type { SignMessageParameters, SendTransactionParameters } from 'viem/actions'
import type { Execute } from '../types/Execute.js'
import type { SignatureStepItem } from '../types/SignatureStepItem.js'
import type { TransactionStepItem } from '../types/TransactionStepItem.js'
import { LogLevel } from './logger.js'
import { getClient } from '../client.js'

const mockClient = {
  log: vi.fn(),
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      viemChain: {
        id: 1,
        name: 'Ethereum'
      }
    },
    {
      id: 137,
      name: 'Polygon',
      viemChain: {
        id: 137,
        name: 'Polygon'
      }
    }
  ]
}

vi.mock('../client.js', () => ({
  getClient: () => mockClient
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Viem wallet adapter', () => {
  const mockWalletClient = {
    account: {
      address: '0x123',
    },
    chain: {
      id: 1,
    },
    transport: {
      type: 'http',
    },
    signMessage: vi.fn().mockImplementation(async ({ account, message }: SignMessageParameters) => {
      if (!account || !message) {
        throw new Error('Missing required parameters')
      }
      return '0xsignature'
    }),
    sendTransaction: vi.fn().mockImplementation(async (args: SendTransactionParameters) => {
      if (!args.to || !args.value) {
        throw new Error('Missing required parameters')
      }
      return '0xtxhash'
    }),
    switchChain: vi.fn().mockImplementation(async ({ id }: { id: number }) => {
      return { id }
    }),
  } as unknown as WalletClient

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Wallet Provider Adaptations', () => {
    const providers = [
      { name: 'MetaMask', isMetaMask: true },
      { name: 'Gate.io', isGateWallet: true },
      { name: 'Generic', ethereum: true }
    ]

    providers.forEach(({ name, ...provider }) => {
      it(`Should adapt ${name} wallet provider correctly`, () => {
        const client = {
          ...mockWalletClient,
          ...provider
        } as WalletClient

        const wallet = adaptViemWallet(client)
        expect(wallet.address).toBeDefined()
        expect(wallet.getChainId).toBeDefined()
        expect(wallet.handleSignMessageStep).toBeDefined()
        expect(wallet.handleSendTransactionStep).toBeDefined()
        expect(wallet.switchChain).toBeDefined()
      })
    })
  })

  describe('Message Signing', () => {
    it('Should handle EIP-191 signature step correctly', async () => {
      const step: Execute['steps'][0] = {
        kind: 'signature',
        action: 'Sign message',
        description: 'Sign test message',
        id: 'test-signature',
        items: [
          {
            status: 'incomplete',
            data: {
              sign: {
                signatureKind: 'eip191' as const,
                message: '0x1234567890abcdef',
                domain: {},
                types: {},
                primaryType: 'Message'
              }
            },
            orderIds: [],
            orderIndexes: []
          } as SignatureStepItem,
        ],
      }

      if (!step.items?.[0]) {
        throw new Error('Invalid step items')
      }

      const wallet = adaptViemWallet(mockWalletClient)
      const result = await wallet.handleSignMessageStep(step.items[0], step)

      expect(getClient().log).toHaveBeenCalledWith(['Execute Steps: Signing with eip191'], LogLevel.Verbose)
      expect(mockWalletClient.signMessage).toHaveBeenCalledWith({
        message: '0x1234567890abcdef',
        account: mockWalletClient.account,
      })
      expect(result).toBe('0xsignature')
    })

    it('Should handle signature step error cases', async () => {
      const wallet = adaptViemWallet(mockWalletClient)
      const step: Execute['steps'][0] = {
        kind: 'signature',
        action: 'Sign message',
        description: 'Sign test message',
        id: 'test-signature',
        items: []
      }

      await expect(
        wallet.handleSignMessageStep(undefined as unknown as SignatureStepItem, step)
      ).rejects.toThrow()
    })
  })

  describe('Transaction Handling', () => {
    it('Should handle send transaction step correctly', async () => {
      const wallet = adaptViemWallet(mockWalletClient)
      const chainId = 1
      const step: Execute['steps'][0] = {
        kind: 'transaction',
        action: 'Send transaction',
        description: 'Send test transaction',
        id: 'test-transaction',
        items: [{
          status: 'incomplete',
          data: {
            to: '0x456' as `0x${string}`,
            from: '0x123' as `0x${string}`,
            value: '1000000000000000000',
            data: '0x',
            maxFeePerGas: '100000000000',
            maxPriorityFeePerGas: '1000000000'
          },
          check: {
            endpoint: "/intents/status",
            method: "GET"
          },
          orderIds: [],
          orderIndexes: []
        }]
      }

      if (!step.items?.[0]) {
        throw new Error('Invalid step items')
      }

      const chain = getClient().chains[0].viemChain
      const result = await wallet.handleSendTransactionStep(chainId, step.items[0] as TransactionStepItem, step)
      expect(getClient().log).toHaveBeenCalledWith(['Execute Steps: Sending transaction'], LogLevel.Verbose)
      expect(mockWalletClient.sendTransaction).toHaveBeenCalledWith({
        chain,
        data: '0x',
        account: mockWalletClient.account,
        to: '0x456',
        value: BigInt('1000000000000000000'),
        maxFeePerGas: BigInt('100000000000'),
        maxPriorityFeePerGas: BigInt('1000000000')
      })
      expect(result).toBe('0xtxhash')
    })

    it('Should handle transaction step error cases', async () => {
      const wallet = adaptViemWallet(mockWalletClient)
      const step: Execute['steps'][0] = {
        kind: 'transaction',
        action: 'Send transaction',
        description: 'Send test transaction',
        id: 'test-transaction',
        items: []
      }

      await expect(
        wallet.handleSendTransactionStep(1, undefined as unknown as TransactionStepItem, step)
      ).rejects.toThrow()
    })
  })

  describe('Chain Switching', () => {
    it('Should handle chain switching correctly', async () => {
      const wallet = adaptViemWallet(mockWalletClient)
      const targetChainId = 137 // Polygon

      await wallet.switchChain(targetChainId)
      expect(mockWalletClient.switchChain).toHaveBeenCalledWith({ id: targetChainId })
      expect(getClient().chains).toBeDefined()
      expect(getClient().chains.length).toBeGreaterThan(0)
    })

    it('Should handle chain switching errors', async () => {
      const failingWalletClient = {
        ...mockWalletClient,
        switchChain: vi.fn().mockRejectedValue(new Error('Chain switch failed')),
        addChain: vi.fn().mockRejectedValue(new Error('Chain switch failed'))
      } as unknown as WalletClient

      const wallet = adaptViemWallet(failingWalletClient)
      await expect(wallet.switchChain(137)).rejects.toThrow('Chain switch failed')
    })
  })
})
