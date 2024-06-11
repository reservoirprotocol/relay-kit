import type { paths } from '@reservoir0x/relay-sdk'

export type UserTransactionsResponse =
  paths['/requests']['get']['responses']['200']['content']['application/json']

export type RelayTransaction = NonNullable<
  NonNullable<UserTransactionsResponse>['requests']
>[0]
