export const tron = {
  id: 728126428
}

export const tronAddressRegex = /^(41[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33})$/

export function isTronAddress(address: string): boolean {
  return tronAddressRegex.test(address)
}
