import { bridge, type BridgeActionParameters } from '../actions/index.js'

/**
 * Method to get a quote for a bridge action
 * @param data - {@link BridgeActionParameters}
 */
export async function getBridgeQuote(data: BridgeActionParameters) {
  return bridge({
    ...data,
    precheck: true,
  })
}
