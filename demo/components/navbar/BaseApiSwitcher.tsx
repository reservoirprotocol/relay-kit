import { useRouter } from 'next/router'
import { FC } from 'react'

export const BaseApiSwitcher: FC = () => {
  const router = useRouter()

  return (
    <select
      value={router.query.api === 'testnets' ? 'testnets' : 'mainnets'}
      onChange={(e) => {
        const selectedValue = e.target.value
        router.push({
          pathname: router.pathname,
          query: { ...router.query, api: selectedValue }
        })
      }}
      style={{
        border: '1px solid gray',
        borderRadius: 4,
        padding: '3.5px 10px'
      }}
    >
      <option value="mainnets">Mainnets</option>
      <option value="testnets">Testnets</option>
    </select>
  )
}
