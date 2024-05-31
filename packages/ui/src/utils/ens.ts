export function isENSName(str: string): boolean {
  const ensRegex = /^[a-zA-Z0-9-]{3,}\.eth$/
  return ensRegex.test(str)
}
