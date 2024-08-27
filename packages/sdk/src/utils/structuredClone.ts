export function safeStructuredClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj)
  }
  // Fallback implementation, for Chrome < 98 (before 2022)
  return JSON.parse(JSON.stringify(obj))
}
