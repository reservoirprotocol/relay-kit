export const bitcoin = {
  id: 8253038
}
const bitcoinAddressRegex = /^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/

export function isBitcoinAddress(address: string): boolean {
  return bitcoinAddressRegex.test(address)
}
