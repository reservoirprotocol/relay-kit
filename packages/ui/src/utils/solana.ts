export const solanaAddressRegex = /^(?!bc1)(?!T)[1-9A-HJ-NP-Za-km-z]{32,44}$/
export const solana = {
  id: 792703809
}
export const eclipse = {
  id: 9286185
}
export const eclipseWallets = ['backpackeclipse']

export function isSolanaAddress(address: string): boolean {
  return solanaAddressRegex.test(address)
}
