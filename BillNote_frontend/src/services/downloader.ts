import request from '@/utils/request.ts'

export type DownloaderCookieResponse = {
  cookie?: string
} & Record<string, unknown>

export const getDownloaderCookie = async (id: string) => {
  return (await request.get('/get_downloader_cookie/' + id)) as DownloaderCookieResponse
}

export const updateDownloaderCookie = async (data: { cookie: string; platform: string }) => {
  return await request.post('/update_downloader_cookie', data)
}
