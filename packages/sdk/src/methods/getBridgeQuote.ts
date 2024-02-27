import { bridge, type BridgeActionParameters } from '../actions/index.js'

export type GetBridgeQuoteParameters = Omit<BridgeActionParameters, 'precheck'>

/**
 * Method to get a quote for a bridge action
 * @param data - {@link GetBridgeQuoteParameters}
 */
export async function getBridgeQuote(data: GetBridgeQuoteParameters) {
  return bridge({
    ...data,
    precheck: true,
  })
}
