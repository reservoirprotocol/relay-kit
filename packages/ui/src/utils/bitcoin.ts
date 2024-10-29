export const bitcoin = {
  id: 8253038
}
const bitcoinAddressRegex =
  /^(bc1[a-zA-HJ-NP-Z0-9]{39,59}|[13][a-km-zA-HJ-NP-Z1-9]{26,35}|[2][mn][a-km-zA-HJ-NP-Z1-9]{43}|[bc][A-HJ-NP-Za-km-z1-9]{25,34})$/

export function isBitcoinAddress(address: string): boolean {
  return bitcoinAddressRegex.test(address)
}
