import { useContext } from 'react'
import { RelayClientContext } from '../providers/RelayClientProvider'

export default function () {
  return useContext(RelayClientContext)
}
