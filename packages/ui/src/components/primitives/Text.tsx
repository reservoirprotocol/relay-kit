import { cva } from '@reservoir0x/relay-design-system/css'

const Text = cva({
  base: {
    color: 'gray12',
    fontFamily: 'body'
  },
  variants: {
    style: {
      h2: {
        fontWeight: 700,
        fontSize: '48px'
      },
      h3: {
        fontWeight: 700,
        fontSize: '32px'
      },
      h4: {
        fontWeight: 700,
        fontSize: '24px'
      },
      h5: {
        fontWeight: 700,
        fontSize: '20px'
      },
      h6: {
        fontWeight: 700,
        fontSize: '16px'
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '16px'
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '14px'
      },
      subtitle3: {
        fontWeight: 500,
        fontSize: '12px'
      },
      body1: {
        fontWeight: 400,
        fontSize: '16px'
      },
      body2: {
        fontWeight: 400,
        fontSize: '14px'
      },
      body3: {
        fontWeight: 400,
        fontSize: '12px'
      },
      tiny: {
        fontWeight: 500,
        fontSize: 10,
        color: 'gray11'
      }
    },
    color: {
      subtle: {
        color: 'gray11'
      },
      error: {
        color: 'red12'
      },
      red: {
        color: 'red11'
      },
      blue: {
        color: 'blue12'
      },
      success: {
        color: 'green11'
      }
    },
    italic: {
      true: {
        fontStyle: 'italic'
      }
    },
    ellipsify: {
      true: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    }
  }
})

export default Text
