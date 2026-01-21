import Provider from '@/components/Form/modelForm/Provider.tsx'
import { Outlet } from 'react-router-dom'

const Model = () => {
  return (
    <div className='flex h-full w-full'>
      {/* Provider List Sidebar */}
      <div className='w-72 flex-shrink-0 border-r border-border/50 bg-card/30 flex flex-col'>
        <Provider />
      </div>

      {/* Model Details Area */}
      <div className='flex-1 min-w-0 bg-background/50 overflow-y-auto'>
        <Outlet />
      </div>
    </div>
  )
}
export default Model
