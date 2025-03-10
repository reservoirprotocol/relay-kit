export const AGWRegistryABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'isAGW',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
