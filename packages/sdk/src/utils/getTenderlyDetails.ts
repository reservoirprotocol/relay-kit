import { axios } from './axios.js'

export type TenderlyErrorInfo = {
  error_message?: string
  address?: string
}

export const getTenderlyDetails = (
  txHash: string
): Promise<TenderlyErrorInfo | null> => {
  return new Promise((resolve) => {
    axios
      .get(`https://api.tenderly.co/api/v1/explorer/${txHash}`, {
        timeout: 5000
      })
      .then((response) => {
        if (response && response.data && response.data.error_info) {
          resolve(response.data.error_info)
        }
        resolve(null)
      })
      .catch((e) => {
        console.warn(`Tenderly api failed: ${e}`)
        resolve(null)
      })
  })
}
