import request from '@/utils/request'

export async function getVideoTags(platform: string, videoId: string) {
  return request.get(`/video_tags/${encodeURIComponent(platform)}/${encodeURIComponent(videoId)}`)
}

export async function setVideoTags(platform: string, videoId: string, tags: string[]) {
  return request.put(`/video_tags/${encodeURIComponent(platform)}/${encodeURIComponent(videoId)}`, { tags })
}

export async function getTagsStats(platform?: string) {
  const query = platform ? `?platform=${encodeURIComponent(platform)}` : ''
  return request.get(`/tags_stats${query}`)
}

