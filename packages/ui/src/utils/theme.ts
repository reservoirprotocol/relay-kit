import type { RelayKitTheme } from '../themes/index.js'
import type { ThemeOverridesMap } from '../providers/RelayKitProvider.js'

export function getValueFromKey(obj: any, key: string): any {
  const keys = key.split('.')
  let value = obj
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      break
    }
  }
  return value
}

// Generate CSS variables based on theme and overrides
export const generateCssVars = (
  theme?: RelayKitTheme,
  themeOverrides?: ThemeOverridesMap
): string => {
  let cssString = ''
  if (!theme || !themeOverrides) {
    return cssString
  }

  // Recursive function to process full theme object
  const processTheme = (obj: any, prefix: string = '') => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key as keyof typeof obj]
        const fullKey = prefix + key
        const cssVarOverride = getValueFromKey(themeOverrides, fullKey)

        if (typeof value === 'object' && value !== null) {
          processTheme(value, fullKey + '.')
        } else if (cssVarOverride && value) {
          cssString += `${cssVarOverride}:${value};\n`
        }
      }
    }
  }

  processTheme(theme)
  return cssString
}

export const isDarkMode = (): boolean => {
  try {
    if (typeof window === 'undefined') return false

    // Check localStorage (next-themes)
    try {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme) return storedTheme === 'dark'
    } catch (e) {
      // localStorage might be unavailable
      console.warn('Failed to access localStorage:', e)
    }

    // Check data-theme attribute
    const dataTheme = document?.documentElement?.getAttribute('data-theme')
    if (dataTheme) return dataTheme === 'dark'

    // Check class
    return document?.documentElement?.classList?.contains('dark') ?? false
  } catch (e) {
    console.warn('Failed to detect dark mode:', e)
    return false // Fallback to light mode
  }
}
