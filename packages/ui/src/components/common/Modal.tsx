import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'
import { AnimatedContent, Overlay } from '../primitives/Dialog.js'
import {
  Root as DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogClose
} from '@radix-ui/react-dialog'
import { Button } from '../primitives/index.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import type { SystemStyleObject } from '@reservoir0x/relay-design-system/types'
import { AnimatePresence } from 'framer-motion'

type ModalProps = {
  trigger?: ReactNode
  contentCss?: SystemStyleObject
  showCloseButton?: boolean
  children: ReactNode
}

export const Modal: FC<
  ComponentPropsWithoutRef<typeof DialogRoot> & ModalProps
> = ({ trigger, contentCss, showCloseButton = true, children, ...props }) => {
  return (
    <DialogRoot modal={true} {...props}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <AnimatePresence>
        {props.open ? (
          <DialogPortal forceMount>
            <Overlay
              forceMount
              css={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: 'blackA10'
              }}
            >
              <AnimatedContent
                forceMount
                css={{
                  '--borderColor': 'colors.subtle-border-color',
                  border: '1px solid var(--borderColor)',
                  padding: '5',
                  ...contentCss
                }}
              >
                {showCloseButton ? (
                  <DialogClose
                    asChild
                    style={{
                      position: 'absolute',
                      right: 20,
                      top: 20,
                      zIndex: 10
                    }}
                  >
                    <Button color="ghost" size="xs" css={{ color: 'gray9' }}>
                      <FontAwesomeIcon icon={faXmark} width={16} height={16} />
                    </Button>
                  </DialogClose>
                ) : null}
                {children}
              </AnimatedContent>
            </Overlay>
          </DialogPortal>
        ) : null}
      </AnimatePresence>
    </DialogRoot>
  )
}
