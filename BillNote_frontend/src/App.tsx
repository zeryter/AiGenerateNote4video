import './App.css'
import { useTaskPolling } from '@/hooks/useTaskPolling.ts'
import SettingPage from './pages/SettingPage/index.tsx'
import { BrowserRouter, Navigate, Routes } from 'react-router-dom'
import { Route } from 'react-router-dom'
import NotFoundPage from '@/pages/NotFoundPage'
import Model from '@/pages/SettingPage/Model.tsx'
import ProviderForm from '@/components/Form/modelForm/Form.tsx'
import AboutPage from '@/pages/SettingPage/about.tsx'
import Downloader from '@/pages/SettingPage/Downloader.tsx'
import DownloaderForm from '@/components/Form/DownloaderForm/Form.tsx'
import { useEffect } from 'react'
import { systemCheck } from '@/services/system.ts'
import { useCheckBackend } from '@/hooks/useCheckBackend.ts'
import BackendInitDialog from '@/components/BackendInitDialog'

// Redesign Imports
import { AppLayout } from '@/components/layout/AppLayout'
import HomePage from '@/pages/Home/index.tsx'
import WorkspacePage from '@/pages/Workspace/index.tsx'
import HistoryPage from '@/pages/History/index.tsx'

function App() {
  useTaskPolling(3000) // 每 3 秒轮询一次
  const { loading, initialized } = useCheckBackend()

  // 在后端初始化完成后执行系统检查
  useEffect(() => {
    if (initialized) {
      systemCheck()
    }
  }, [initialized])

  // 如果后端还未初始化，显示初始化对话框
  if (!initialized) {
    return (
      <>
        <BackendInitDialog open={loading} />
      </>
    )
  }

  // 后端已初始化，渲染主应用
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/history" element={<HistoryPage />} />


            <Route path="settings" element={<SettingPage />}>
              <Route index element={<Navigate to="model" replace />} />
              <Route path="model" element={<Model />}>
                <Route path="new" element={<ProviderForm isCreate />} />
                <Route path=":id" element={<ProviderForm />} />
              </Route>
              <Route path="download" element={<Downloader />}>
                <Route path=":id" element={<DownloaderForm />} />
              </Route>
              <Route path="about" element={<AboutPage />}></Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App