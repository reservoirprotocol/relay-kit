import { bitcoin } from '../utils/bitcoin.js'
import { solana } from '../utils/solana.js'

export default [
  {
    name: 'Avalanche (C-Chain)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'avax_cchain',
    chainId: '43114',
    contractAddress: '0x0000000000000000000000000000000000000000'
  },
  {
    name: 'Basic Attention Token',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'bat',
    chainId: '1',
    contractAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef'
  },
  {
    name: 'Dai',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'dai',
    chainId: '1',
    contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f'
  },
  {
    name: 'Ethereum',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'eth',
    chainId: '1',
    contractAddress: '0x0000000000000000000000000000000000000000'
  },
  {
    name: 'Ethereum (Arbitrum)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'eth_arbitrum',
    chainId: '42161',
    contractAddress: '0x0000000000000000000000000000000000000000'
  },
  {
    name: 'Ethereum (Base)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'eth_base',
    chainId: '8453',
    contractAddress: '0x0000000000000000000000000000000000000000'
  },
  {
    name: 'Ethereum (OP)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'eth_optimism',
    chainId: '10',
    contractAddress: '0x0000000000000000000000000000000000000000'
  },
  {
    name: 'Ethereum (Polygon)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'eth_polygon',
    chainId: '137',
    contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
  },
  {
    name: 'Immutable X (ERC-20)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'imx',
    chainId: '1',
    contractAddress: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff'
  },
  {
    name: 'Chainlink',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'link',
    chainId: '1',
    contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca'
  },
  {
    name: 'Decentraland',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'mana',
    chainId: '1',
    contractAddress: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942'
  },
  {
    name: 'Pepe (ERC-20)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'pepe',
    chainId: '1',
    contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933'
  },
  {
    name: 'POL (ERC-20)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'pol',
    chainId: '1',
    contractAddress: '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6'
  },
  {
    name: 'POL (Polygon)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'pol_polygon',
    chainId: '137',
    contractAddress: '0x0000000000000000000000000000000000000000'
  },
  {
    name: 'PayPal USD',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY'],
    code: 'pyusd',
    chainId: '1',
    contractAddress: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8'
  },
  {
    name: 'Shiba Inu (ERC-20)',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'shib',
    chainId: '1',
    contractAddress: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce'
  },
  {
    name: 'Uniswap',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'uni',
    chainId: '1',
    contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
  },
  {
    name: 'USD Coin (ERC-20)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['VI'],
    code: 'usdc',
    chainId: '1',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  },
  {
    name: 'USD Coin (Arbitrum)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdc_arbitrum',
    chainId: '42161',
    contractAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  {
    name: 'USD Coin (Base)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdc_base',
    chainId: '8453',
    contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  },
  {
    name: 'USD Coin (Avalanche C-Chain)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdc_cchain',
    chainId: '43114',
    contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  },
  {
    name: 'USD Coin (OP Mainnet)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['VI'],
    code: 'usdc_optimism',
    chainId: '10',
    contractAddress: '0x7f5c764cbc14f9669b88837ca1490cca17c31607'
  },
  {
    name: 'USD Coin (Polygon)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['VI'],
    code: 'usdc_polygon',
    chainId: '137',
    contractAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'
  },
  {
    name: 'Tether (ERC-20)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdt',
    chainId: '1',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
  },
  {
    name: 'Tether (Arbitrum)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdt_arbitrum',
    chainId: '42161',
    contractAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
  },
  {
    name: 'Tether (BEP-20)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdt_bsc',
    chainId: '56',
    contractAddress: '0x55d398326f99059ff775485246999027b3197955'
  },
  {
    name: 'Tether (Polygon)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdt_polygon',
    chainId: '137',
    contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
  },
  {
    name: '0x',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'zrx',
    chainId: '1',
    contractAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498'
  },
  {
    chainId: `${bitcoin.id}`,
    code: 'btc',
    contractAddress: 'bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmql8k8',
    name: 'Bitcoin',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    type: 'crypto'
  },
  {
    name: 'Solana',
    type: 'crypto',
    notAllowedCountries: [],
    notAllowedUSStates: ['VI'],
    code: 'sol',
    chainId: `${solana.id}`,
    contractAddress: '11111111111111111111111111111111'
  },
  {
    name: 'USD Coin (Solana)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['VI'],
    code: 'usdc_sol',
    chainId: `${solana.id}`,
    contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  },
  {
    name: 'Tether (Solana)',
    type: 'crypto',
    notAllowedCountries: ['CA'],
    notAllowedUSStates: ['NY', 'VI'],
    code: 'usdt_sol',
    chainId: `${solana.id}`,
    contractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
  }
]
