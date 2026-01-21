import MenuBar, { IMenuProps } from '@/pages/SettingPage/components/menuBar.tsx'
import {
  BotMessageSquare,
  HardDriveDownload,
  Info,
} from 'lucide-react'

const Menu = () => {
  const menuList: IMenuProps[] = [
    {
      id: 'model',
      name: 'AI 模型设置',
      icon: <BotMessageSquare />,
      path: '/settings/model',
    },
    {
      id: 'download',
      name: '下载配置',
      icon: <HardDriveDownload />,
      path: '/settings/download',
    },
    {
      id: 'about',
      name: '关于',
      icon: <Info />,
      path: '/settings/about',
    },
  ]
  return (
    <div className="flex h-full flex-col">
      <div className={'flex w-full flex-col gap-1 px-2 py-4'}>
        <div className="text-xl font-semibold px-2 mb-1">设置</div>
        <div className="text-xs font-medium text-muted-foreground px-2">全局配置与模型设置</div>
      </div>
      <div className="flex-1 px-2">
        {menuList &&
          menuList.map(item => {
            return <MenuBar key={item.id} menuItem={item} />
          })}
      </div>
    </div>
  )
}
export default Menu
