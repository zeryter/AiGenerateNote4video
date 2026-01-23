import { create } from 'zustand'
import { IProvider } from '@/types'
import {
  addProvider,
  getProviderById,
  getProviderList,
  updateProviderById,
  deleteProviderById,
} from '@/services/model.ts'

type ProviderApiItem = {
  id: string
  name: string
  logo: string
  api_key?: string
  base_url: string
  type: string
  enabled: number
}

type ProviderCreatePayload = Omit<IProvider, 'id'>

interface ProviderStore {
  provider: IProvider[]
  setProvider: (provider: IProvider) => void
  setAllProviders: (providers: IProvider[]) => void
  getProviderById: (id: number) => IProvider | undefined
  getProviderList: () => IProvider[]
  fetchProviderList: () => Promise<void>
  loadProviderById: (id: string) => Promise<IProvider>
  addNewProvider: (provider: ProviderCreatePayload) => Promise<string | undefined>
  updateProvider: (provider: IProvider) => Promise<void>
  deleteProvider: (id: string) => Promise<void>
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  provider: [],

  // 添加或更新一个 provider
  setProvider: newProvider =>
    set(state => {
      const exists = state.provider.find(p => p.id === newProvider.id)
      if (exists) {
        return {
          provider: state.provider.map(p => (p.id === newProvider.id ? newProvider : p)),
        }
      } else {
        return { provider: [...state.provider, newProvider] }
      }
    }),

  // 设置整个 provider 列表
  setAllProviders: providers => set({ provider: providers }),
  loadProviderById: async (id: string) => {
    const res = (await getProviderById(id)) as unknown
    const item = (res as { data?: ProviderApiItem }).data ?? (res as ProviderApiItem)

    return {
      id: item.id,
      name: item.name,
      logo: item.logo,
      apiKey: item.api_key,
      baseUrl: item.base_url,
      type: item.type,
      enabled: item.enabled,
    }
  },
  addNewProvider: async (provider: ProviderCreatePayload) => {
    const payload = {
      ...provider,
      api_key: provider.apiKey,
      base_url: provider.baseUrl,
    }
    try {
      const res = (await addProvider(payload)) as unknown
      // Request interceptor handles error codes, so if we get here, it's successful
      console.log('Provider added:', res)

      await get().fetchProviderList()
      const id = (res as { id?: string }).id ?? (res as { data?: { id?: string } }).data?.id
      return id
    } catch (error) {
      console.error('Error adding provider:', error)
      throw error
    }
  },
  // 按 id 获取单个 provider
  getProviderById: id => get().provider.find(p => String(p.id) === String(id)),
  updateProvider: async (provider: IProvider) => {
    try {
      const data = {
        ...provider,
        api_key: provider.apiKey,
        base_url: provider.baseUrl,
      }
      const res = await updateProviderById(data)
      // Request interceptor handles error codes
      console.log('Provider updated:', res)
      await get().fetchProviderList()
    } catch (error) {
      console.error('Error updating provider:', error)
      throw error
    }
  },
  deleteProvider: async (id: string) => {
    try {
      await deleteProviderById(id)
      await get().fetchProviderList()
    } catch (error) {
      console.error('Error deleting provider:', error)
      throw error
    }
  },
  getProviderList: () => get().provider,
  fetchProviderList: async () => {
    try {
      const res = (await getProviderList()) as unknown
      const list = Array.isArray(res)
        ? (res as ProviderApiItem[])
        : ((res as { data?: ProviderApiItem[] }).data ?? [])

      set({
        provider: list.map(item => ({
          id: item.id,
          name: item.name,
          logo: item.logo,
          apiKey: item.api_key,
          baseUrl: item.base_url,
          type: item.type,
          enabled: item.enabled,
        })),
      })
    } catch (error) {
      console.error('Error fetching provider list:', error)
    }
  },
}))
