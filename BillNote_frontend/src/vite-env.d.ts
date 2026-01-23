/// <reference types="vite/client" />

declare module 'react-syntax-highlighter' {
  import type { ComponentType, CSSProperties, ReactNode } from 'react'

  export type SyntaxHighlighterStyle = Record<string, CSSProperties>

  export interface SyntaxHighlighterProps {
    style?: SyntaxHighlighterStyle
    language?: string
    children?: ReactNode
    PreTag?: keyof JSX.IntrinsicElements | ComponentType
    className?: string
    customStyle?: CSSProperties
    [key: string]: unknown
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>
  export default SyntaxHighlighter
}
declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import type { CSSProperties } from 'react'

  export type PrismStyle = Record<string, CSSProperties>
  export const atomDark: PrismStyle
  const styles: PrismStyle
  export default styles
}
