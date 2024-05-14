import { swap, type SwapActionParameters } from '../actions/index.js'

export type GetSwapQuoteParameters = Omit<SwapActionParameters, 'precheck'>

/**
 * Method to get a quote for a bridge action
 * @param data - {@link GetSwapQuoteParameters}
 */
export async function getSwapQuote(data: GetSwapQuoteParameters) {
  return swap({
    ...data,
    precheck: true,
  })
}
