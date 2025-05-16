import useIsMounted from 'hooks/useIsMounted'
import { useTheme } from 'next-themes'
import { FC } from 'react'

export const ThemeSwitcher: FC = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const isMounted = useIsMounted()

  if (!isMounted) return null

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      style={{
        border: '1px solid gray',
        borderRadius: 4,
        padding: '2px 10px'
      }}
    >
      {resolvedTheme === 'light' ? 'Light' : 'Dark'}
    </button>
  )
}
