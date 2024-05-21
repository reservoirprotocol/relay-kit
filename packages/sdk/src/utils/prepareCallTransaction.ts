import type { paths } from '../types/index.js'
import { encodeFunctionData } from 'viem'
import type { SimulateContractParameters } from 'viem'

type CallBody = NonNullable<
  paths['/execute/call']['post']['requestBody']['content']['application/json']
>

export default function prepareCallTransaction(
  request: Pick<
    SimulateContractParameters,
    'abi' | 'functionName' | 'args' | 'address' | 'value'
  >
): Required<NonNullable<CallBody['txs']>[0]> {
  const { abi, functionName, args } = request

  const data = encodeFunctionData({ abi, functionName, args })
  return {
    to: request.address,
    value: request?.value?.toString() ?? '0',
    data: data
  }
}
