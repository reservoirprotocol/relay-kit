import { call, type CallActionParameters } from '../actions/index.js'

export type GetCallQuoteParameters = Omit<CallActionParameters, 'precheck'>

/**
 * Method to get a quote for a call action
 * @param data - {@link GetCallQuoteParameters}
 */
export async function getCallQuote(data: GetCallQuoteParameters) {
  return call({
    ...data,
    precheck: true,
  })
}
