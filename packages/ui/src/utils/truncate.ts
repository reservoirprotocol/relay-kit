/**
 * Ensure that an Ethereum address does not overflow
 * by removing the middle characters
 * @param address An Ethereum address
 * @param shrinkInidicator Visual indicator to show address is only
 * partially displayed
 * @returns A shrinked version of the Ethereum address
 * with the middle characters removed.
 */
function truncateAddress(
  address?: string,
  shrinkInidicator?: string,
  firstSectionLength?: number,
  lastSectionLength?: number
) {
  return address
    ? address.slice(0, firstSectionLength ?? 4) +
        (shrinkInidicator || '…') +
        address.slice(-(lastSectionLength ?? 4))
    : address
}

function truncateEns(ensName: string, shrinkInidicator?: string) {
  if (ensName.length < 24) return ensName

  return ensName.slice(0, 20) + (shrinkInidicator || '…') + ensName.slice(-3)
}

export { truncateAddress, truncateEns }
