//@ts-ignore
import {
  cva,
  css as designCss,
  type Styles
} from '@reservoir0x/relay-design-system/css'
import type { FC, PropsWithChildren } from 'react'

const BoxCss = cva({})

type BoxCssProps = Parameters<typeof BoxCss>['0']

const Box: FC<{ css?: Styles } & BoxCssProps & PropsWithChildren> = ({
  css,
  children,
  ...props
}) => {
  return <div className={designCss(BoxCss.raw(props), css)}>{children}</div>
}

export default Box
