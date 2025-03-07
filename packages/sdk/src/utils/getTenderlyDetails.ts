import { axios } from './axios.js'

export type TenderlyErrorInfo = {
  error_message?: string
  address?: string
}

export const getTenderlyDetails = (
  txHash: string
): Promise<TenderlyErrorInfo | null> => {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://api.tenderly.co/api/v1/explorer/${txHash}`)
      .then((response) => {
        if (response && response.data && response.data.error_info) {
          resolve(response.data.error_info)
        }
        resolve(null)
      })
      .catch((e) => {
        reject(e)
      })
  })
}
