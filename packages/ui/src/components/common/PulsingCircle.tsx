import { FC } from 'react'
import { styled } from '../../styled-system/jsx'

export const PulsingCircle: FC<{
  color?: string
  pulseColor?: string
  size?: string
  stopped?: boolean
}> = ({ color, pulseColor, size, stopped }) => {
  return (
    <svg
      width={size ?? '50'}
      height={size ?? '50'}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      {stopped ? null : (
        <circle
          cx="20"
          cy="20"
          fill="none"
          r="10"
          stroke={pulseColor ?? '#383a36'}
          stroke-width="2"
        >
          <animate
            attributeName="r"
            from="8"
            to="20"
            dur="1.5s"
            begin="0s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="1"
            to="0"
            dur="1.5s"
            begin="0s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle cx="20" cy="20" fill={color ?? '#383a36'} r="10" />
    </svg>
  )
}
