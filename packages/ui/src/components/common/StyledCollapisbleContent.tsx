import * as Collapsible from '@radix-ui/react-collapsible'
import { styled } from '../../styled-system/jsx'

export const StyledCollapsibleContent = styled(Collapsible.CollapsibleContent, {
  base: {
    overflow: 'hidden',
    _data_state_open: {
      animation: `collapsibleSlideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)`
    },
    _data_state_closed: {
      animation: `collapsibleSlideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)`
    }
  }
})
