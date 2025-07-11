import {
  arbitrum,
  arbitrumNova,
  base,
  baseGoerli,
  mainnet,
  optimism,
  sepolia,
  zora
} from 'viem/chains'
import type { RelayChain } from './types/index.js'
import { LogLevel, log as logUtil } from './utils/logger.js'
import * as actions from './actions/index.js'
import * as utils from './utils/index.js'
import { MAINNET_RELAY_API, MAINNET_RELAY_WS } from './constants/servers.js'
import { SDK_VERSION } from './version.js'

/**
 * RelayClient Configuration Options
 * @param source Used to manually override the source domain used to attribute local orders
 * @param logLevel Log level from 0-4, the higher the more verbose.
 * @param maxPollingAttemptsBeforeTimeout The maximum number of attempts the synced api is polled before timing out. The api is polled every 5 secs (default is 30)
 */
export type RelayClientOptions = {
  baseApiUrl?: string
  source?: string
  logLevel?: LogLevel
  pollingInterval?: number
  maxPollingAttemptsBeforeTimeout?: number
  chains?: RelayChain[]
  useGasFeeEstimations?: boolean
  uiVersion?: string
  logger?: (message: Parameters<typeof logUtil>['0'], level: LogLevel) => void
  confirmationPollingInterval?: number
  websocket?: {
    enabled?: boolean
    url?: string // Optional, falls back to default
  }
}

let _client: RelayClient
const _backupChains: RelayChain[] = [
  mainnet,
  base,
  zora,
  optimism,
  arbitrum,
  arbitrumNova
].map((chain) => utils.convertViemChainToRelayChain(chain))
const _backupTestnetChains: RelayChain[] = [sepolia, baseGoerli].map((chain) =>
  utils.convertViemChainToRelayChain(chain)
)

export class RelayClient {
  version: string
  uiVersion?: string
  baseApiUrl: string
  source?: string
  logLevel: LogLevel
  pollingInterval?: number
  confirmationPollingInterval?: number
  maxPollingAttemptsBeforeTimeout?: number
  useGasFeeEstimations: boolean
  chains: RelayChain[]
  websocketEnabled: boolean
  websocketUrl: string
  log(
    message: Parameters<typeof logUtil>['0'],
    level: LogLevel = LogLevel.Info
  ) {
    return logUtil(message, level, this.logLevel)
  }

  readonly utils = { ...utils }
  readonly actions = actions

  constructor(options: RelayClientOptions) {
    this.version = SDK_VERSION
    this.uiVersion = options.uiVersion
    this.baseApiUrl = options.baseApiUrl ?? MAINNET_RELAY_API
    this.logLevel =
      options.logLevel !== undefined ? options.logLevel : LogLevel.None
    this.pollingInterval = options.pollingInterval
    this.maxPollingAttemptsBeforeTimeout =
      options.maxPollingAttemptsBeforeTimeout
    this.useGasFeeEstimations = options.useGasFeeEstimations ?? true
    this.websocketEnabled = options.websocket?.enabled ?? false
    this.websocketUrl = options.websocket?.url ?? MAINNET_RELAY_WS
    if (options.chains) {
      this.chains = options.chains
    } else if (options.baseApiUrl?.includes('testnets')) {
      this.chains = _backupTestnetChains
    } else {
      this.chains = _backupChains
    }

    if (!options.source) {
      if (typeof window !== 'undefined') {
        let host = location.hostname
        if (host.indexOf('www.') === 0) {
          host = host.replace('www.', '')
        }
        this.source = host
        console.warn(
          'RelaySDK automatically generated a source based on the url, we recommend providing a source when initializing the sdk. Refer to our docs for steps on how to do this: https://docs.relay.link/references/sdk/getting-started#configuration'
        )
      }
    } else {
      this.source = options.source
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
    this.confirmationPollingInterval = options.confirmationPollingInterval
      ? options.confirmationPollingInterval
      : this.confirmationPollingInterval
    this.maxPollingAttemptsBeforeTimeout =
      options.maxPollingAttemptsBeforeTimeout
        ? options.maxPollingAttemptsBeforeTimeout
        : this.maxPollingAttemptsBeforeTimeout
    this.useGasFeeEstimations =
      options.useGasFeeEstimations !== undefined
        ? options.useGasFeeEstimations
        : this.useGasFeeEstimations
    this.websocketEnabled =
      options.websocket?.enabled !== undefined
        ? options.websocket.enabled
        : this.websocketEnabled
    this.websocketUrl = options.websocket?.url || this.websocketUrl

    if (options.logger) {
      this.log = options.logger
    } else {
      this.log = (
        message: Parameters<typeof logUtil>['0'],
        level: LogLevel = LogLevel.Info
      ) => {
        logUtil(message, level, this.logLevel)
      }
    }

    if (options.chains) {
      this.chains = options.chains
    }
  }
}

export async function configureDynamicChains() {
  try {
    const chains = await utils.fetchChainConfigs(
      _client.baseApiUrl,
      _client.source
    )
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

/**
 * Creates a Relay Client
 *
 * - Docs: https://docs.relay.link/references/sdk/createClient
 *
 * @param options - {@link RelayClientOptions}
 * @returns A Relay Client. {@link RelayClient}
 *
 * @example
 * import { createClient, LogLevel, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk'
 *
 * const relayClient = createClient({
 *    baseApiUrl: MAINNET_RELAY_API,
 *    source: "YOUR-SOURCE",
 *    logLevel: LogLevel.Verbose,
 * })
 */
export function createClient(options: RelayClientOptions) {
  if (!_client) {
    _client = new RelayClient({ ...options })
  } else {
    _client.configure(options)
  }

  return _client
}
