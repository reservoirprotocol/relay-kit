import { axios } from './axios.js'
import type { AxiosRequestConfig } from 'axios'

export function request(config: AxiosRequestConfig = {}) {
  return axios.request(config)
}

export function isAPIError(error?: Error) {
  return error && error.cause === 'APIError'
}

export class APIError extends Error {
  type: string
  statusCode: number
  rawError: any
  endpoint?: string

  constructor(
    message: string = 'Unknown Reason',
    statusCode: number,
    rawError?: any,
    type: string = 'APIError',
    options: any = {}
  ) {
    super(message, { ...options, cause: 'APIError' })
    this.name = 'APIError'
    this.type = type
    this.statusCode = statusCode
    this.endpoint = rawError?.endpoint
    this.rawError = rawError
  }
}
