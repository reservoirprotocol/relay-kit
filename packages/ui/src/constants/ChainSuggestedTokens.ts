import type { Token } from '../types'

export enum ChainId {
  // Mainnets
  ETHEREUM = 1,
  OPTIMISM = 10,
  POLYGON = 137,
  MINT = 185,
  BOBA = 288,
  ZKSYNC = 324,
  SHAPE = 360,
  WORLD_CHAIN = 480,
  REDSTONE = 690,
  POLYGON_ZK_EVM = 1101,
  LISK = 1135,
  HYCHAIN = 2911,
  HAM = 5112,
  CYBER = 7560,
  B3 = 8333,
  BASE = 8453,
  ONCHAIN_POINTS = 17071,
  APE_CHAIN = 33139,
  FUNKICHAIN = 33979,
  MODE = 34443,
  ARBITRUM = 42161,
  ARBITRUM_NOVA = 42170,
  AVALANCHE = 43114,
  SUPERPOSITION = 55244,
  LINEA = 59144,
  BOB = 60808,
  PROOF_OF_PLAY_APEX = 70700,
  PROOF_OF_PLAY_BOSS = 70701,
  BLAST = 81457,
  SCROLL = 534352,
  XAI = 660279,
  FORMA = 984122,
  ZORA = 7777777,
  BITCOIN = 8253038,
  DEGEN = 666666666,
  SOLANA = 792703809,
  ANCIENT8 = 888888888,
  RARI = 1380012617,

  // Testnets
  BOBA_TESTNET = 111,
  MODE_TESTNET = 919,
  UNICHAIN_SEPOLIA = 1301,
  ATLAS_RELAY_TESTNET = 1357,
  B3_SEPOLIA = 1993,
  LISK_SEPOLIA = 4202,
  CREATOR_TESTNET = 4654,
  ARENA_Z_TESTNET = 9897,
  SHAPE_SEPOLIA = 11011,
  ABSTRACT_TESTNET = 11124,
  GAME7_TESTNET = 13746,
  HOLESKY = 17000,
  GARNET = 17069,
  APEX_TESTNET = 70800,
  POP_CLOUD_TESTNET = 70805,
  AMOY = 80002,
  BASE_SEPOLIA = 84532,
  TAIKO_HEKLA = 167009,
  ARBITRUM_SEPOLIA = 421614,
  ALIGN_TESTNET_V2 = 472382,
  ODYSSEY = 911867,
  ECLIPSE_TESTNET = 1118190,
  FUNKICHAIN_TESTNET = 3397901,
  ZERO_TESTNET = 4457845,
  BITCOIN_TESTNET_4 = 9092725,
  SEPOLIA = 11155111,
  OP_SEPOLIA = 11155420,
  ZORA_SEPOLIA = 999999999,
  SOLANA_DEVNET = 1936682084,
  ARBITRUM_BLUEBERRY = 88153591557
}

const ChainSuggestedTokens: Record<number, Token[]> = {
  // Mainnets
  [ChainId.ETHEREUM]: [
    {
      chainId: 1,
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: 1,
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1696507857',
      verified: true
    },
    {
      chainId: 1,
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/9956/large/Badge_Dai.png?1696509996',
      verified: true
    }
  ],
  [ChainId.OPTIMISM]: [
    {
      chainId: ChainId.OPTIMISM,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: ChainId.OPTIMISM,
      address: '0x4200000000000000000000000000000000000042',
      name: 'Optimism',
      symbol: 'OP',
      decimals: 18,
      logoURI: 'https://ethereum-optimism.github.io/data/OP/logo.png',
      verified: true
    },
    {
      chainId: ChainId.OPTIMISM,
      address: '0x68f180fcce6836688e9084f035309e29bf0a2095',
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      verified: true
    }
  ],
  [ChainId.POLYGON]: [
    {
      chainId: ChainId.POLYGON,
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: ChainId.POLYGON,
      address: '0x0000000000000000000000000000000000000000',
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
      logoURI:
        'https://assets.coingecko.com/coins/images/4713/thumb/matic-token-icon.png?1624446912',
      verified: true
    },
    {
      chainId: ChainId.POLYGON,
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      verified: true
    }
  ],
  [ChainId.MINT]: [
    {
      chainId: ChainId.MINT,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.BOBA]: [
    {
      chainId: ChainId.BOBA,
      address: '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.ZKSYNC]: [
    {
      chainId: ChainId.ZKSYNC,
      address: '0xf00dad97284d0c6f06dc4db3c32454d4292c6813',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: ChainId.ZKSYNC,
      address: '0xbbeb516fb02a01611cbbe0453fe3c580d7281011',
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      verified: true
    }
  ],
  [ChainId.SHAPE]: [
    {
      chainId: ChainId.SHAPE,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.WORLD_CHAIN]: [
    {
      chainId: ChainId.WORLD_CHAIN,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: ChainId.WORLD_CHAIN,
      address: '0x79a02482a880bce3f13e09da970dc34db4cd24d1',
      name: 'Bridged USDC (world-chain-mainnet)',
      symbol: 'USDC.e',
      decimals: 6,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/50792/large/usdc.png?1729233082',
      verified: true
    }
  ],
  [ChainId.REDSTONE]: [
    {
      chainId: ChainId.REDSTONE,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.POLYGON_ZK_EVM]: [
    {
      chainId: ChainId.POLYGON_ZK_EVM,
      address: '0x4f9a0e7fd2bf6067db6994cf12e4495df938e6e9',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.LISK]: [
    {
      chainId: ChainId.LISK,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.HAM]: [
    {
      chainId: ChainId.HAM,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.CYBER]: [
    {
      chainId: ChainId.CYBER,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.B3]: [
    {
      chainId: ChainId.B3,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.BASE]: [
    {
      chainId: ChainId.BASE,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: ChainId.BASE,
      address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
      name: 'Degen',
      symbol: 'DEGEN',
      decimals: 18,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/34515/large/android-chrome-512x512.png?1706198225',
      verified: true
    }
  ],
  [ChainId.APE_CHAIN]: [
    {
      chainId: ChainId.APE_CHAIN,
      address: '0x48b62137edfa95a428d35c09e44256a739f6b557',
      name: 'Wrapped ApeCoin',
      symbol: 'WAPE',
      decimals: 18,
      logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/33535.png',
      verified: true
    },
    {
      chainId: ChainId.APE_CHAIN,
      address: '0xa2235d059f80e176d931ef76b6c51953eb3fbef4',
      name: 'Ape USD',
      symbol: 'ApeUSD',
      decimals: 18,
      logoURI: 'https://dev.default-token-list-ble.pages.dev/assets/apeusd.jpg',
      verified: true
    }
  ],
  [ChainId.MODE]: [
    {
      chainId: ChainId.MODE,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.ARBITRUM]: [
    {
      chainId: ChainId.ARBITRUM,
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: ChainId.ARBITRUM,
      address: '0x4cb9a7ae498cedcbb5eae9f25736ae7d428c9d66',
      name: 'Xai',
      symbol: 'XAI',
      decimals: 18,
      logoURI: 'https://assets.relay.link/icons/currencies/xai.png',
      verified: true
    },
    {
      chainId: ChainId.ARBITRUM,
      address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      verified: true
    }
  ],
  [ChainId.ARBITRUM_NOVA]: [
    {
      chainId: ChainId.ARBITRUM_NOVA,
      address: '0x722e8bdd2ce80a4422e880164f2079488e115365',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.AVALANCHE]: [
    {
      chainId: ChainId.AVALANCHE,
      address: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    },
    {
      chainId: ChainId.AVALANCHE,
      address: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      verified: true
    },
    {
      chainId: ChainId.AVALANCHE,
      address: '0x50b7545627a5162f82a992c33b87adc75187b218',
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      verified: true
    }
  ],
  [ChainId.LINEA]: [
    {
      chainId: ChainId.LINEA,
      address: '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.PROOF_OF_PLAY_APEX]: [
    {
      chainId: ChainId.PROOF_OF_PLAY_APEX,
      address: '0x77684a04145a5924efce0d92a7c4a2a2e8c359de',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.PROOF_OF_PLAY_BOSS]: [
    {
      chainId: ChainId.PROOF_OF_PLAY_BOSS,
      address: '0x48a9b22b80f566e88f0f1dcc90ea15a8a3bae8a4',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.BLAST]: [
    {
      chainId: ChainId.BLAST,
      address: '0x4300000000000000000000000000000000000004',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.SCROLL]: [
    {
      chainId: ChainId.SCROLL,
      address: '0x5300000000000000000000000000000000000004',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.ZORA]: [
    {
      chainId: ChainId.ZORA,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.DEGEN]: [
    {
      chainId: ChainId.DEGEN,
      address: '0xeb54dacb4c2ccb64f8074eceea33b5ebb38e5387',
      name: 'Wrapped Degen',
      symbol: 'WDEGEN',
      decimals: 18,
      logoURI: 'https://assets.relay.link/icons/currencies/degen.png',
      verified: true
    }
  ],
  [ChainId.SOLANA]: [
    {
      chainId: ChainId.SOLANA,
      address: 'So11111111111111111111111111111111111111112',
      name: 'Wrapped SOL',
      symbol: 'WSOL',
      decimals: 9,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/21629/large/solana.jpg?1696520989',
      verified: true
    }
  ],
  [ChainId.ANCIENT8]: [
    {
      chainId: ChainId.ANCIENT8,
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ],
  [ChainId.CREATOR_TESTNET]: [
    {
      chainId: ChainId.CREATOR_TESTNET,
      address: '0x34AF38Ec07708dBC01C5A814fc418D3840448fce',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      verified: true
    }
  ]
}

export default ChainSuggestedTokens
