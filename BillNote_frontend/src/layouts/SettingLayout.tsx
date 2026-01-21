import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Link, Outlet } from 'react-router-dom'
import { Home } from 'lucide-react'
import React from 'react'
import logo from '@/assets/icon.svg'

interface ISettingLayoutProps {
  Menu: React.ReactNode
}
const SettingLayout = ({ Menu }: ISettingLayoutProps) => {
  return (
    <div className="h-full w-full bg-background">
      <div className="flex flex-1 h-full">
        {/* 左侧部分：Header + 表单 */}
        <aside className="flex w-[300px] flex-col border-r border-border/50 bg-card/50 backdrop-blur-sm">
          {/* Header */}
          <header className="flex h-16 items-center justify-between px-6 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
                <img src={logo} alt="logo" className="h-full w-full object-contain" />
              </div>
              <div className="text-2xl font-bold text-foreground">BiliNote</div>
            </div>
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Link to={'/'}>
                      <Home className="text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>返回首页</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </header>

          {/* 表单内容 */}
          <div className="flex-1 overflow-auto p-4">
            {Menu}
          </div>
        </aside>

        {/* 右侧预览区域 */}
        <main className="h-full flex-1 overflow-hidden bg-background/50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default SettingLayout
