import { useContext } from 'react'
import { RelayClientContext } from '../providers/RelayClientProvider.js'

export default function () {
  return useContext(RelayClientContext)
}
