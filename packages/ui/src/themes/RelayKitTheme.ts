interface Button {
  color?: string
  background?: string
  hover?: {
    color?: string
    background?: string
  }
}

export interface RelayKitTheme {
  font?: string
  primaryColor?: string
  focusColor?: string
  subtleBorderColor?: string
  text?: {
    default?: string
    subtle?: string
    error?: string
    success?: string
  }
  buttons?: {
    primary?: Button
    secondary?: Button
    tertiary?: Button
    disabled?: {
      color?: string
      background?: string
    }
  }
  input?: {
    background?: string
    borderRadius?: string
    border?: string
  }
  anchor?: {
    color?: string
    hover?: {
      color?: string
    }
  }
  dropdown?: {
    background?: string
    borderRadius?: string
  }
  widget?: {
    background?: string
    borderRadius?: string
    border?: string
    boxShadow?: string
    card?: {
      background?: string
      borderRadius?: string
    }
  }
  modal?: {
    background?: string
    border?: string
    borderRadius?: string
  }
}

export const defaultTheme: RelayKitTheme = {
  font: '-apple-system, Helvetica, sans-serif',
  primaryColor: 'primary9',
  text: {
    default: 'gray12',
    subtle: 'gray11',
    error: 'red12',
    success: 'green11'
  },
  widget: {}
}
