import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef, ElementRef, FC, ReactNode } from 'react'
import { forwardRef, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { cva } from '@reservoir0x/relay-design-system/css'

const OverlayStyle = cva({
  base: {
    position: 'fixed',
    inset: 0
  }
})

const Overlay: FC = () => {
  return (
    <DialogPrimitive.Overlay
      className={OverlayStyle()}
    ></DialogPrimitive.Overlay>
  )
}

// styled(DialogPrimitive.Overlay, {
//   base: {
//     position: 'fixed',
//     inset: 0
//   }
// })

const Content = cva({
  base: {
    backgroundColor: 'neutralBg',
    borderRadius: 16,
    position: 'fixed',
    left: '50%',
    top: '100%',
    minWidth: '90vw',
    maxWidth: '100vw',
    sm: {
      minWidth: '400px',
      maxWidth: '532px'
    },
    maxHeight: '85vh',
    overflowY: 'auto',
    _focus: { outline: 'none' },
    '@media(max-width: 520px)': {
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
      width: '100%'
    }
  }
})

const AnimatedContent = forwardRef<
  ElementRef<typeof Content>,
  ComponentPropsWithoutRef<typeof Content>
>(({ children, ...props }, forwardedRef) => {
  const isMobile = useMediaQuery('(max-width: 520px)')

  const animation = isMobile
    ? {
        initial: {
          opacity: 0,
          bottom: '-100%',
          top: 'auto',
          left: 0
        },
        animate: {
          opacity: 1,
          bottom: 0,
          top: 'auto',
          left: 0
        },

        exit: {
          opacity: 0,
          bottom: '-100%',
          top: 'auto',
          left: 0
        }
      }
    : {
        initial: {
          opacity: 0,
          top: '50%',
          transform: 'translateX(-50%) translateY(-50%)'
        },
        animate: {
          opacity: 1,
          top: '50%',
          transform: 'translateX(-50%) translateY(-50%)'
        },
        exit: {
          opacity: 0,
          top: '50%',
          transform: 'translateX(-50%) translateY(-50%)'
        }
      }

  return (
    <Content forceMount asChild {...props}>
      <motion.div
        key={isMobile + 'modal'}
        ref={forwardedRef}
        transition={{ type: isMobile ? 'tween' : 'spring', duration: 0.2 }}
        {...animation}
      >
        {children}
      </motion.div>
    </Content>
  )
})

AnimatedContent.displayName = 'AnimatedContent'

type Props = {
  trigger: ReactNode
  portalProps?: DialogPrimitive.PortalProps
}

const Dialog = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & Props
>(({ children, trigger, portalProps, ...props }, forwardedRef) => {
  const [open, setOpen] = useState(false)

  return (
    <DialogPrimitive.Root onOpenChange={setOpen} open={open}>
      <DialogPrimitive.DialogTrigger asChild>
        {trigger}
      </DialogPrimitive.DialogTrigger>
      {open && (
        <DialogPrimitive.DialogPortal {...portalProps}>
          <Content ref={forwardedRef} {...props}>
            {children}
          </Content>
        </DialogPrimitive.DialogPortal>
      )}
    </DialogPrimitive.Root>
  )
})

Dialog.displayName = 'Dialog'

export { Dialog, Content, AnimatedContent, Overlay }
