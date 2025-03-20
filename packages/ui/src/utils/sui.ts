export const suiTestnet = {
  id: 11272032
}

export const sui = {
  id: 103665049
}
const suiAddressRegex = /^(0x[a-fA-F0-9]{64})$/

export function isSuiAddress(address: string): boolean {
  return suiAddressRegex.test(address)
}
