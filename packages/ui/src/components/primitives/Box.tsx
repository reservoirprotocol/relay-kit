import {
  cva,
  css as designCss,
  type Styles
} from '@reservoir0x/relay-design-system/css'
import type { FC, PropsWithChildren } from 'react'

const BoxCss = cva({})

type BoxCssProps = Parameters<typeof BoxCss>['0']

const Box: FC<
  { css?: Styles; id?: string } & BoxCssProps & PropsWithChildren
> = ({ css, children, id, ...props }) => {
  return (
    <div className={designCss(BoxCss.raw(props), designCss.raw(css))} id={id}>
      {children}
    </div>
  )
}

export default Box
