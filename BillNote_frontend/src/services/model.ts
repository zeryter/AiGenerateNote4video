import request from '@/utils/request.ts'

export interface ProviderPayload {
  id?: string | number
  name: string
  logo?: string
  api_key?: string
  base_url?: string
  type?: string
  enabled?: number
}

export interface ProviderConnectionPayload {
  api_key: string
  base_url: string
  type?: string
}

export const getProviderList = async () => {
  return await request.get('/get_all_providers')
}
export const getProviderById = async (id: string) => {
  return await request.get(`/get_provider_by_id/${id}`)
}
export const updateProviderById = async (data: ProviderPayload) => {
  return await request.post('/update_provider', data)
}

export const addProvider = async (data: ProviderPayload) => {
  return await request.post('/add_provider', data)
}

export const testConnection = async (data: ProviderConnectionPayload) => {
  return await request.post('/connect_test', data)
}

export const fetchModels = async (providerId: string) => {
  return await request.get('/model_list/' + providerId)
}

export const fetchEnableModelById = async (id: string) => {
  return await request.get('/model_enable/' + id)
}

export async function addModel(data: { provider_id: string; model_name: string }) {
  return request.post('/models', data)
}

export const fetchEnableModels = async () => {
  return await request.get('/model_list')
}

export const deleteModelById = async (modelId: string | number) => {
  return await request.get(`/models/delete/${modelId}`)
}

export const deleteProviderById = async (id: string | number) => {
  return await request.get(`/delete_provider/${id}`)
}
