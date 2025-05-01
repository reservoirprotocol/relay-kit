import { sha256 as _sha256 } from '@noble/hashes/sha2.js'

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

export function sha256(params: Record<string, any>): string {
  const str = normalizeAndStringify(params)
  const bytes = new TextEncoder().encode(str)
  const hash = _sha256(bytes)
  return [...hash].map((b) => Number(b).toString(16).padStart(2, '0')).join('')
}
