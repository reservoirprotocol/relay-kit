import { x64 } from 'murmurhash3js-revisited'

function normalizeAndStringify(obj: Record<string, any>): string {
  const replacer = (_key: string, value: any) => {
    if (typeof value === 'bigint') return value.toString()
    if (typeof value === 'undefined') return null
    if (
      typeof value === 'object' &&
      value !== null &&
      'toString' in value &&
      typeof value.toString === 'function'
    ) {
      return value.toString()
    }
    return value
  }

  const sorted = Object.keys(obj)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = obj[key]
        return acc
      },
      {} as Record<string, any>
    )

  return JSON.stringify(sorted, replacer)
}

// MurmurHash3 is a non-cryptographic hash function designed for:
// Speed
// Good distribution
// Low collision rates
// Use in hash tables, caches, deduplication, or ID generation

export function murmurhash(params: Record<string, any>): string {
  const str = normalizeAndStringify(params)
  return x64.hash128(new TextEncoder().encode(str))
}
