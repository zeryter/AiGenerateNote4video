import { useEffect, useRef } from 'react'
import type { AxiosError } from 'axios'
import { useTaskStore } from '@/store/taskStore'
import { get_task_status } from '@/services/note.ts'
import toast from 'react-hot-toast'
import { makeVideoKey, useTagStore } from '@/store/tagStore'
import type { AudioMeta, Task, TaskStatus, Transcript } from '@/store/taskStore'

type TaskStatusResponse = {
  status?: TaskStatus
  message?: string
  result?: {
    markdown?: Task['markdown']
    transcript?: Transcript
    audio_meta?: AudioMeta
  }
  tags?: string[]
}

export const useTaskPolling = (interval = 3000) => {
  const tasks = useTaskStore(state => state.tasks)
  const updateTaskContent = useTaskStore(state => state.updateTaskContent)

  const tasksRef = useRef(tasks)

  // 每次 tasks 更新，把最新的 tasks 同步进去
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    const timer = setInterval(async () => {
      const pendingTasks = tasksRef.current.filter(
        task => task.status != 'SUCCESS' && task.status != 'FAILED'
      )

      for (const task of pendingTasks) {
        try {
          console.log('🔄 正在轮询任务：', task.id)
          const res = (await get_task_status(task.id)) as unknown as TaskStatusResponse
          const { status, message } = res
          const nextMessage = typeof message === 'string' && message.trim().length > 0 ? message : undefined

          if (status && (status !== task.status || nextMessage !== task.statusMessage)) {
            if (status === 'SUCCESS') {
              const { markdown, transcript, audio_meta } = res.result ?? {}
              const incomingTags = Array.isArray(res.tags) ? res.tags : []
              const key = makeVideoKey(audio_meta?.platform, audio_meta?.video_id)
              if (key && incomingTags.length > 0) {
                useTagStore.getState().setTagsForKey(key, incomingTags)
              }
              toast.success('笔记生成成功')
              updateTaskContent(task.id, {
                status,
                markdown: markdown ?? task.markdown,
                transcript: transcript ?? task.transcript,
                audioMeta: audio_meta ?? task.audioMeta,
                tags: incomingTags.length > 0 ? incomingTags : undefined,
                statusMessage: nextMessage,
              })
            } else if (status === 'FAILED') {
              updateTaskContent(task.id, { status, statusMessage: nextMessage })
              console.warn(`⚠️ 任务 ${task.id} 失败`)
            } else {
              updateTaskContent(task.id, { status, statusMessage: nextMessage })
            }
          }
        } catch (error: unknown) {
          const err = error as AxiosError<{ code?: number; msg?: string }> & {
            code?: number
            msg?: string
          }
          const errCode = err?.response?.data?.code ?? (typeof err?.code === 'number' ? err.code : undefined)
          const errMsg = err?.response?.data?.msg ?? err?.msg
          if (errCode === 500 && typeof errMsg === 'string') {
            updateTaskContent(task.id, { status: 'FAILED', statusMessage: errMsg })
            console.warn(`⚠️ 任务 ${task.id} 失败：${errMsg}`)
            continue
          }
          console.error('❌ 任务轮询网络异常（暂不处理，等待重试）：', error)
        }
      }
    }, interval)

    return () => clearInterval(timer)
  }, [interval, updateTaskContent])
}
