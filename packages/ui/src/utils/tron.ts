export const tron = {
  id: 0  // TODO: Confirm correct chain ID for Tron
}

export const tronAddressRegex = /^(T|3)[a-zA-Z0-9]{34}$/

export function isTronAddress(address: string): boolean {
  return tronAddressRegex.test(address)
}
