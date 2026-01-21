import * as Icons from '@lobehub/icons'
import CustomLogo from '@/assets/customAI.png'

interface AILogoProps {
  name: string // 图标名称（区分大小写！如 OpenAI、DeepSeek）
  style?: 'Color' | 'Text' | 'Outlined' | 'Glyph'
  size?: number
}

const AILogo = ({ name, style = 'Color', size = 24 }: AILogoProps) => {
  const Icon = Icons[name as keyof typeof Icons]

  if (name === 'custom' || !Icon) {
    if (name !== 'custom') {
      console.warn(`⚠️ 图标组件不存在: ${name}, 使用默认图标`)
    }
    return (
      <span style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={CustomLogo} alt="CustomLogo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </span>
    )
  }

  const Variant = Icon[style as keyof typeof Icon]
  if (!Variant) {
    return <Icon size={size} />
  }

  return <Variant size={size} />
}

export default AILogo
