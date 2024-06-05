type BorderRadius = number | string

interface Button {
  color?: string
  background?: string
  borderRadius?: BorderRadius
  font?: string
  hover?: this
  disabled?: this
}

export interface RelayKitTheme {
  font?: string
  primaryColor?: string
  text?: {
    default?: string
    subtle?: string
    error?: string
    success?: string
  }
  buttons?: {
    primary?: Button
    secondary?: Button
  }
  input?: {
    background?: string
    borderRadius?: BorderRadius
    border?: string
  }
  anchor?: {
    color?: string
    font?: string
    hover?: {
      color?: string
    }
  }
  widget?: {
    borderRadius?: BorderRadius
    border?: string
    boxShadow?: string
    card?: {
      background?: string
      border?: string
      borderRadius?: BorderRadius
    }
  }
  modal?: {
    background?: string
    border?: string
    borderRadius?: BorderRadius
  }
}

export const defaultTheme: RelayKitTheme = {
  font: '-apple-system, Helvetica, sans-serif', // verify that inter works
  primaryColor: 'primary9',
  text: {
    default: 'gray12',
    subtle: 'gray11',
    error: 'red12',
    success: 'green11'
  },
  widget: {}
}
