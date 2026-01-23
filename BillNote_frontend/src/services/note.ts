import request from '@/utils/request'
import toast from 'react-hot-toast'

export type GenerateNotePayload = {
  video_url: string
  platform: string
  quality: string
  model_name: string
  provider_id: string
  task_id?: string
  format: string[]
  style: string
  extras?: string
  video_understand?: boolean
  video_understanding?: boolean
  video_interval?: number
  grid_size: number[]
  link?: boolean
  screenshot?: boolean
}

type GenerateNoteResponse = {
  task_id?: string
} & Record<string, unknown>

export const generateNote = async (data: GenerateNotePayload) => {
  try {
    console.log('generateNote', data)
    const response = (await request.post('/generate_note', data)) as GenerateNoteResponse | null

    if (!response) {
      return null
    }
    toast.success('笔记生成任务已提交！')

    console.log('res', response)
    // 成功提示

    return response
  } catch (error: unknown) {
    console.error('❌ 请求出错', error)

    // 错误提示
    // toast.error('笔记生成失败，请稍后重试')

    throw error // 抛出错误以便调用方处理
  }
}

export const delete_task = async ({
  video_id,
  platform,
  task_id,
}: {
  video_id?: string
  platform?: string
  task_id?: string
}) => {
  try {
    const data = {
      video_id,
      platform,
      task_id,
    }
    const res = await request.post('/delete_task', data)


    toast.success('任务已成功删除')
    return res
  } catch (error: unknown) {
    toast.error('请求异常，删除任务失败')
    console.error('❌ 删除任务失败:', error)
    throw error
  }
}

export const get_task_status = async (task_id: string) => {
  try {
    // 成功提示

    return await request.get('/task_status/' + task_id)
  } catch (error: unknown) {
    console.error('❌ 请求出错', error)
    throw error // 抛出错误以便调用方处理
  }
}

export const getAllTasks = async () => {
  try {
    return await request.get('/tasks')
  } catch (error: unknown) {
    console.error('❌ 获取任务列表失败', error)
    // toast.error('获取历史记录失败')
    return []
  }
}
