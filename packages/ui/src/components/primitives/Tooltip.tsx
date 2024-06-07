import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as Popover from '@radix-ui/react-popover'
import { useMediaQuery } from 'usehooks-ts'
import Box from './Box'
import { cva } from '@reservoir0x/relay-design-system/css'

const TooltipArrowStyle = cva({
  base: {
    fill: 'modal-background'
  }
})

const PopoverArrow = cva({
  base: {
    fill: 'modal-background'
  }
})

const Tooltip = ({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: any) => {
  const isSmallDevice = useMediaQuery('(max-width: 600px)')

  if (isSmallDevice) {
    return (
      <Popover.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <Popover.Trigger asChild>{children}</Popover.Trigger>
        <Popover.Content
          sideOffset={2}
          side="bottom"
          align="center"
          style={{ zIndex: 100, outline: 'none', maxWidth: '100vw' }}
          {...props}
        >
          <Popover.Arrow className={PopoverArrow()} />
          <Box
            css={{
              zIndex: 9999,
              boxShadow: '0px 1px 5px rgba(0,0,0,0.2)',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          >
            <Box
              css={{
                background: 'modal-background',
                p: '2'
              }}
            >
              {content}
            </Box>
          </Box>
        </Popover.Content>
      </Popover.Root>
    )
  }
  return (
    <TooltipPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delayDuration={250}
    >
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        sideOffset={2}
        side="bottom"
        align="center"
        style={{ zIndex: 100 }}
        {...props}
      >
        <div className={TooltipArrowStyle()}></div>
        <Box
          css={{
            zIndex: 9999,
            boxShadow: '0px 1px 5px rgba(0,0,0,0.2)',
            borderRadius: 8,
            overflow: 'hidden'
          }}
        >
          <Box
            css={{
              background: 'modal-background',
              p: '2'
            }}
          >
            {content}
          </Box>
        </Box>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  )
}

export default Tooltip
