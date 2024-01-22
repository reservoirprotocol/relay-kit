import { NextPage } from 'next'
import Link from 'next/link'

const Index: NextPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        gap: 12,
        padding: 24,
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <h2>SDK Actions</h2>
      <nav style={{ display: 'flex', gap: 15 }}>
        <Link href="/sdk/callAction">
          Call
        </Link>
      </nav>
    </div>
  )
}

export default Index
