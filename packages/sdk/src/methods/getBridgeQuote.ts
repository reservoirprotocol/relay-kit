import type { Execute } from '../types/Execute.js'
import { bridge, type BridgeActionParameters } from '../actions/index.js'

export type GetBridgeQuoteParameters = Omit<BridgeActionParameters, 'precheck'>

/**
 * Method to get a quote for a bridge action
 * @param data - {@link GetBridgeQuoteParameters}
 */
export async function getBridgeQuote(
  data: GetBridgeQuoteParameters
): Promise<Execute> {
  const result = await bridge({
    ...data,
    precheck: true,
  })

  return result as Execute
}
