export const tron = {
  id: 728126428
}

export const tronAddressRegex = /^(T|3)[a-zA-Z0-9]{34}$/

export function isTronAddress(address: string): boolean {
  return tronAddressRegex.test(address)
}
