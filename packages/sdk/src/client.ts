import {
  arbitrum,
  arbitrumNova,
  base,
  baseGoerli,
  mainnet,
  optimism,
  sepolia,
  zora,
} from 'viem/chains'
import * as actions from './actions/index.js'
import type { RelayChain } from './types/index.js'
import * as utils from './utils/index.js'
import { LogLevel, log as logUtil } from './utils/logger.js'

/**
 * RelayClient Configuration Options
 * @param source Used to manually override the source domain used to attribute local orders
 * @param logLevel Log level from 0-4, the higher the more verbose.
 * @param maxPollingAttemptsBeforeTimeout The maximum number of attempts the synced api is polled before timing out. The api is polled every 5 secs (default is 30)
 */
export type RelayClientOptions = {
  baseApiUrl: string
  source?: string
  logLevel?: LogLevel
  pollingInterval?: number
  maxPollingAttemptsBeforeTimeout?: number
  chains?: RelayChain[]
}

let _client: RelayClient
const _backupChains: RelayChain[] = [
  mainnet,
  base,
  zora,
  optimism,
  arbitrum,
  arbitrumNova,
].map((chain) => utils.convertViemChainToRelayChain(chain))
const _backupTestnetChains: RelayChain[] = [sepolia, baseGoerli].map((chain) =>
  utils.convertViemChainToRelayChain(chain)
)

export class RelayClient {
  baseApiUrl: string
  source?: string
  logLevel: LogLevel
  pollingInterval?: number
  maxPollingAttemptsBeforeTimeout?: number
  chains: RelayChain[]
  log(
    message: Parameters<typeof logUtil>['0'],
    level: LogLevel = LogLevel.Info
  ) {
    return logUtil(message, level, this.logLevel)
  }

  readonly utils = { ...utils }
  readonly actions = actions

  constructor(options: RelayClientOptions) {
    this.baseApiUrl = options.baseApiUrl
    this.source = options.source
    this.logLevel =
      options.logLevel !== undefined ? options.logLevel : LogLevel.None
    this.pollingInterval = options.pollingInterval
    this.maxPollingAttemptsBeforeTimeout =
      options.maxPollingAttemptsBeforeTimeout
    if (options.chains) {
      this.chains = options.chains
    } else if (options.baseApiUrl.includes('testnets')) {
      this.chains = _backupTestnetChains
    } else {
      this.chains = _backupChains
    }
  }

  configure(options: Partial<RelayClientOptions>) {
    this.baseApiUrl = options.baseApiUrl ? options.baseApiUrl : this.baseApiUrl
    this.source = options.source ? options.source : this.source
    this.logLevel =
      options.logLevel !== undefined ? options.logLevel : LogLevel.None
    this.pollingInterval = options.pollingInterval
      ? options.pollingInterval
      : this.pollingInterval
    this.maxPollingAttemptsBeforeTimeout =
      options.maxPollingAttemptsBeforeTimeout
        ? options.maxPollingAttemptsBeforeTimeout
        : options.maxPollingAttemptsBeforeTimeout
    if (options.chains) {
      this.chains = options.chains
    }
  }
}

export async function configureDynamicChains() {
  try {
    const chains = await utils.fetchChainConfigs(_client.baseApiUrl)
    _client.chains = chains
    return chains
  } catch (e) {
    _client.log(
      ['Failed to fetch remote chain configuration, falling back', e],
      LogLevel.Error
    )
    throw e
  }
}

export function getClient() {
  return _client
}

export function createClient(options: RelayClientOptions) {
  if (!_client) {
    _client = new RelayClient(options)
  } else {
    _client.configure(options)
  }

  return _client
}
