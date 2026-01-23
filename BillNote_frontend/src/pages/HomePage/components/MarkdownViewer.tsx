import { Children, FC, useEffect, useState, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type { ReactMarkdownProps } from 'react-markdown/lib/ast-to-react'
import { Button } from '@/components/ui/button.tsx'
import { Copy, ArrowRight, Play, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Error from '@/components/Lottie/error.tsx'
import Loading from '@/components/Lottie/Loading.tsx'
import Idle from '@/components/Lottie/Idle.tsx'
import StepBar from '@/pages/HomePage/components/StepBar.tsx'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark as codeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import gfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'github-markdown-css/github-markdown-light.css'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { useTaskStore } from '@/store/taskStore'
import { noteStyles } from '@/constant/note.ts'
import { MarkdownHeader } from '@/pages/HomePage/components/MarkdownHeader.tsx'
import TranscriptViewer from '@/pages/HomePage/components/transcriptViewer.tsx'
import MarkmapEditor from '@/pages/HomePage/components/MarkmapComponent.tsx'

interface VersionNote {
  ver_id: string
  content: string
  style: string
  model_name: string
  created_at?: string
}

interface MarkdownViewerProps {
  content: string | VersionNote[]
  status: 'idle' | 'loading' | 'success' | 'failed'
}

const steps = [
  { label: '解析链接', key: 'PARSING' },
  { label: '下载音频', key: 'DOWNLOADING' },
  { label: '转写文字', key: 'TRANSCRIBING' },
  { label: '总结内容', key: 'SUMMARIZING' },
  { label: '保存完成', key: 'SUCCESS' },
]

const MarkdownViewer: FC<MarkdownViewerProps> = ({ status }) => {
  const [currentVerId, setCurrentVerId] = useState<string>('')
  const [selectedContent, setSelectedContent] = useState<string>('')
  const [modelName, setModelName] = useState<string>('')
  const [style, setStyle] = useState<string>('')
  const [createTime, setCreateTime] = useState<string>('')
  // 确保baseURL没有尾部斜杠
  const baseURL = (String(import.meta.env.VITE_API_BASE_URL || '').replace('/api','') || '').replace(/\/$/, '')
  const getCurrentTask = useTaskStore.getState().getCurrentTask
  const currentTask = useTaskStore(state => state.getCurrentTask())
  const taskStatus = currentTask?.status || 'PENDING'
  const retryTask = useTaskStore.getState().retryTask
  const isMultiVersion = Array.isArray(currentTask?.markdown)
  const [showTranscribe, setShowTranscribe] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'preview'>('preview')
  // 多版本内容处理
  useEffect(() => {
    if (!currentTask) return

    if (!isMultiVersion) {
      setCurrentVerId('') // 清空旧版本 ID
      setModelName(currentTask.formData.model_name)
      setStyle(currentTask.formData.style)
      setCreateTime(currentTask.createdAt)
      setSelectedContent(typeof currentTask.markdown === 'string' ? currentTask.markdown : '')
    } else {
      const versions = Array.isArray(currentTask.markdown) ? currentTask.markdown : []
      const latestVersion = [...versions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      if (latestVersion) {
        setCurrentVerId(latestVersion.ver_id)
      }
    }
  }, [currentTask, isMultiVersion])
  useEffect(() => {
    if (!currentTask || !isMultiVersion) return

    const versions = Array.isArray(currentTask.markdown) ? currentTask.markdown : []
    const currentVer = versions.find(v => v.ver_id === currentVerId)
    if (currentVer) {
      setModelName(currentVer.model_name)
      setStyle(currentVer.style)
      setCreateTime(currentVer.created_at || '')
      setSelectedContent(currentVer.content)
    }
  }, [currentVerId, currentTask, isMultiVersion])
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedContent)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }
  const handleDownload = () => {
    const task = getCurrentTask()
    const name = task?.audioMeta.title || 'note'
    const blob = new Blob([selectedContent], { type: 'text/markdown;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${name}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const markdownComponents: Components = {
    h1: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'h1'> & ReactMarkdownProps
      return (
      <h1
        className="text-primary my-6 scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl"
        {...rest}
      >
        {children}
      </h1>
      )
    },
    h2: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'h2'> & ReactMarkdownProps
      return (
      <h2
        className="text-primary mt-10 mb-4 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0"
        {...rest}
      >
        {children}
      </h2>
      )
    },
    h3: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'h3'> & ReactMarkdownProps
      return (
      <h3
        className="text-primary mt-8 mb-4 scroll-m-20 text-xl font-semibold tracking-tight"
        {...rest}
      >
        {children}
      </h3>
      )
    },
    h4: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'h4'> & ReactMarkdownProps
      return (
      <h4
        className="text-primary mt-6 mb-2 scroll-m-20 text-lg font-semibold tracking-tight"
        {...rest}
      >
        {children}
      </h4>
      )
    },
    p: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'p'> & ReactMarkdownProps
      return (
        <p className="leading-7 [&:not(:first-child)]:mt-6" {...rest}>
          {children}
        </p>
      )
    },
    a: (props: ReactMarkdownProps) => {
      const { href, children, node, ...rest } = props as ComponentPropsWithoutRef<'a'> &
        ReactMarkdownProps
      void node
      const childArray = Children.toArray(children)
      const firstChild = childArray[0]
      const firstText = typeof firstChild === 'string' ? firstChild : ''
      const isOriginLink = firstText.startsWith('原片 @')

      if (isOriginLink) {
        const timeMatch = firstText.match(/原片 @ (\d{2}:\d{2})/)
        const timeText = timeMatch ? timeMatch[1] : '原片'

        return (
          <span className="origin-link my-2 inline-flex">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              {...rest}
            >
              <Play className="h-3.5 w-3.5" />
              <span>原片（{timeText}）</span>
            </a>
          </span>
        )
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-0.5 font-medium underline underline-offset-4"
          {...rest}
        >
          {children}
          {href?.startsWith('http') && <ExternalLink className="ml-0.5 inline-block h-3 w-3" />}
        </a>
      )
    },
    img: (props: ReactMarkdownProps) => {
      const { src, node, ...rest } = props as ComponentPropsWithoutRef<'img'> &
        ReactMarkdownProps
      void node
      let resolvedSrc = src
      if (resolvedSrc && resolvedSrc.startsWith('/')) {
        resolvedSrc = baseURL + resolvedSrc
      }
      return (
        <div className="my-8 flex justify-center">
          <Zoom>
            <img
              {...rest}
              src={resolvedSrc}
              className="max-w-full cursor-zoom-in rounded-lg object-cover shadow-md transition-all hover:shadow-lg"
              style={{ maxHeight: '500px' }}
            />
          </Zoom>
        </div>
      )
    },
    strong: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'strong'> &
        ReactMarkdownProps
      return (
        <strong className="text-primary font-bold" {...rest}>
          {children}
        </strong>
      )
    },
    li: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'li'> & ReactMarkdownProps
      const rawText = String(children)
      const isFakeHeading = /^(\*\*.+\*\*)$/.test(rawText.trim())

      if (isFakeHeading) {
        return <div className="text-primary my-4 text-lg font-bold">{children}</div>
      }

      return (
        <li className="my-1" {...rest}>
          {children}
        </li>
      )
    },
    ul: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'ul'> & ReactMarkdownProps
      return (
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...rest}>
          {children}
        </ul>
      )
    },
    ol: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'ol'> & ReactMarkdownProps
      return (
        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...rest}>
          {children}
        </ol>
      )
    },
    blockquote: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'blockquote'> &
        ReactMarkdownProps
      return (
        <blockquote
          className="border-primary/20 text-muted-foreground mt-6 border-l-4 pl-4 italic"
          {...rest}
        >
          {children}
        </blockquote>
      )
    },
    code: (props: ReactMarkdownProps) => {
      const { inline, className, children, node, style: inlineStyle, ...rest } = props as ComponentPropsWithoutRef<'code'> &
        ReactMarkdownProps & { inline?: boolean }
      void node
      const match = /language-(\w+)/.exec(className || '')
      const codeContent = String(children).replace(/\n$/, '')

      if (!inline && match) {
        return (
          <div className="group bg-muted relative my-6 overflow-hidden rounded-lg border shadow-sm">
            <div className="bg-muted text-muted-foreground flex items-center justify-between px-4 py-1.5 text-sm font-medium">
              <div>{match[1].toUpperCase()}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeContent)
                  toast.success('代码已复制')
                }}
                className="bg-background/80 hover:bg-background flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                复制
              </button>
            </div>
            <SyntaxHighlighter
              style={codeStyle}
              language={match[1]}
              PreTag="div"
              className="!bg-muted !m-0 !p-0"
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '0.9rem',
              }}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        )
      }

      return (
        <code
          className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm"
          style={inlineStyle}
          {...rest}
        >
          {children}
        </code>
      )
    },
    table: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'table'> & ReactMarkdownProps
      return (
        <div className="my-6 w-full overflow-y-auto">
          <table className="w-full border-collapse text-sm" {...rest}>
            {children}
          </table>
        </div>
      )
    },
    th: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'th'> & ReactMarkdownProps
      return (
        <th
          className="border-muted-foreground/20 border px-4 py-2 text-left font-medium [&[align=center]]:text-center [&[align=right]]:text-right"
          {...rest}
        >
          {children}
        </th>
      )
    },
    td: (props: ReactMarkdownProps) => {
      const { children, ...rest } = props as ComponentPropsWithoutRef<'td'> & ReactMarkdownProps
      return (
        <td
          className="border-muted-foreground/20 border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
          {...rest}
        >
          {children}
        </td>
      )
    },
    hr: (props: ReactMarkdownProps) => {
      const { ...rest } = props as ComponentPropsWithoutRef<'hr'> & ReactMarkdownProps
      return <hr className="border-muted-foreground/20 my-8" {...rest} />
    },
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 text-neutral-500">
        <StepBar steps={steps} currentStep={taskStatus} />
        <Loading />
        <div className="text-center text-sm">
          <p className="text-lg font-bold">正在生成笔记，请稍候…</p>
          <p className="mt-2 text-xs text-neutral-500">这可能需要几秒钟时间，取决于视频长度</p>
        </div>
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-3 text-neutral-500">
        <Idle />
        <div className="text-center">
          <p className="text-lg font-bold">输入视频链接并点击“生成笔记”</p>
          <p className="mt-2 text-xs text-neutral-500">支持哔哩哔哩、YouTube 、抖音等视频平台</p>
        </div>
      </div>
    )
  }

  if (status === 'failed' && !isMultiVersion) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 space-y-3">
        <Error />
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">笔记生成失败</p>
          <p className="mt-2 mb-2 text-xs text-red-400">请检查后台或稍后再试</p>

          <Button onClick={() => currentTask && retryTask(currentTask.id)} size="lg">
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <MarkdownHeader
        currentTask={currentTask ?? undefined}
        isMultiVersion={isMultiVersion}
        currentVerId={currentVerId}
        setCurrentVerId={setCurrentVerId}
        modelName={modelName}
        style={style}
        noteStyles={noteStyles}
        onCopy={handleCopy}
        onDownload={handleDownload}
        createAt={createTime}
        showTranscribe={showTranscribe}
        setShowTranscribe={setShowTranscribe}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {viewMode === 'map' ? (
        <div className="flex w-full flex-1 overflow-hidden bg-white">
          <div className={'w-full'}>
            <MarkmapEditor
              value={selectedContent}
              height="100%" // 根据需求可以设定百分比或固定高度
              title={currentTask?.audioMeta?.title || '思维导图'}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden bg-white py-2">
          {selectedContent && selectedContent !== 'loading' && selectedContent !== 'empty' ? (
            <>
              <ScrollArea className="w-full">
                <div className={'markdown-body w-full px-2'}>
                  <ReactMarkdown
                    remarkPlugins={[gfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {selectedContent}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
              {showTranscribe && (
                <div className={'ml-2 w-2/4'}>
                  <TranscriptViewer />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="w-[300px] flex-col justify-items-center">
                <div className="bg-primary-light mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <ArrowRight className="text-primary h-8 w-8" />
                </div>
                <p className="mb-2 text-neutral-600">输入视频链接并点击"生成笔记"按钮</p>
                <p className="text-xs text-neutral-500">支持哔哩哔哩、YouTube等视频网站</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MarkdownViewer
