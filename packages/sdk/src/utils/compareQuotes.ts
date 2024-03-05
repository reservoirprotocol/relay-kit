import type { Execute } from '../types/index.js'

export const compareQuotes = (estimatedQuote: Execute, newQuote: Execute) => {
  const estimatedIsSplit = (estimatedQuote.breakdown ?? []).length > 1
  const newIsSplit = (newQuote.breakdown ?? []).length > 1

  if (estimatedIsSplit != newIsSplit && newIsSplit) {
    throw 'Quote is now using split routes, user confirmation required'
  }
}
