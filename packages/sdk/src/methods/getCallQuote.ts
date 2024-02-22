import { call, type CallActionParamaters } from '../actions/index.js'

/**
 * Method to get a quote for a call action
 * @param data - {@link CallActionParamaters}
 */
export async function getCallQuote(data: CallActionParamaters) {
  return call({
    ...data,
    precheck: true,
  })
}
