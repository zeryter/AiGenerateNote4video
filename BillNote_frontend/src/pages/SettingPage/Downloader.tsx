import { Outlet } from 'react-router-dom'
import Options from '@/components/Form/DownloaderForm/Options.tsx'
const Downloader = () => {
  return (
    <div className={'flex h-full bg-background'}>
      <div className={'flex-1/5 border-r border-border/50 p-2 bg-card/30'}>
        <Options></Options>
      </div>
      <div className={'flex-4/5 bg-background/50'}>
        <Outlet />
      </div>
    </div>
  )
}
export default Downloader
