// import styles from './index.module.css' 
import { JSX } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface IMenuProps {
  id: string
  name: string
  icon: JSX.Element
  path: string
}

const MenuBar: ({ menuItem }: { menuItem: any }) => JSX.Element = ({ menuItem }) => {
  const location = useLocation()
  const isActive =
    location.pathname.startsWith(menuItem.path + '/') || location.pathname === menuItem.path

  return (
    <Link to={menuItem.path} className="w-full block mb-1">
      <div
        className={cn(
          "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <div className="h-4 w-4 flex-shrink-0">{menuItem.icon}</div>
        <div className="text-sm">{menuItem.name}</div>
      </div>
    </Link>
  )
}

export default MenuBar
