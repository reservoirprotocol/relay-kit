import { type WriteContractParameters } from 'viem'

export type SimulateContractRequest = WriteContractParameters<any>

export function isSimulateContractRequest(
  tx: any
): tx is SimulateContractRequest {
  return (tx as SimulateContractRequest).abi !== undefined
}
