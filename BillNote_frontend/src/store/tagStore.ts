import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export function makeVideoKey(platform?: string, videoId?: string) {
  if (!platform || !videoId) return ''
  return `${platform}:${videoId}`
}

function normalizeTags(tags: string[]) {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const t of tags || []) {
    if (typeof t !== 'string') continue
    const cleaned = t.trim()
    if (!cleaned) continue
    if (seen.has(cleaned)) continue
    seen.add(cleaned)
    normalized.push(cleaned)
  }
  return normalized
}

interface TagStore {
  tagsByKey: Record<string, string[]>
  setTagsForKey: (key: string, tags: string[]) => void
  getTagsForKey: (key: string) => string[]
  hydrateFromTasks: (tasks: any[]) => void
}

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      tagsByKey: {},
      setTagsForKey: (key, tags) => {
        if (!key) return
        set(state => ({
          tagsByKey: { ...state.tagsByKey, [key]: normalizeTags(tags) },
        }))
      },
      getTagsForKey: key => {
        if (!key) return []
        return get().tagsByKey[key] || []
      },
      hydrateFromTasks: tasks => {
        const next: Record<string, string[]> = { ...get().tagsByKey }
        for (const t of tasks || []) {
          const platform = t?.audioMeta?.platform || t?.platform || t?.formData?.platform
          const videoId = t?.audioMeta?.video_id
          const key = makeVideoKey(platform, videoId)
          const tags = t?.tags
          if (!key || !Array.isArray(tags)) continue
          next[key] = normalizeTags(tags)
        }
        set({ tagsByKey: next })
      },
    }),
    { name: 'tag-storage' }
  )
)

