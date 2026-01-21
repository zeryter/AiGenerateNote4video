import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams, useNavigate } from 'react-router-dom'
import { useProviderStore } from '@/store/providerStore'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Tag } from 'antd'
import { useModelStore } from '@/store/modelStore'
import { testConnection, deleteModelById } from '@/services/model.ts'
import { ModelSelector } from '@/components/Form/modelForm/ModelSelector.tsx'

interface IModelListItem {
  id: string
  provider_id: string
  model_name: string
  created_at?: string
}

// ✅ Provider表单schema
const ProviderSchema = z.object({
  name: z.string().min(2, '名称不能少于 2 个字符'),
  apiKey: z.string().optional().or(z.literal('')),
  baseUrl: z.string().url('必须是合法 URL'),
  type: z.string(),
})

type ProviderFormValues = z.infer<typeof ProviderSchema>

const ProviderForm = ({ isCreate = false }: { isCreate?: boolean }) => {
  let { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !isCreate

  const loadProviderById = useProviderStore(state => state.loadProviderById)
  const updateProvider = useProviderStore(state => state.updateProvider)
  const addNewProvider = useProviderStore(state => state.addNewProvider)
  const deleteProvider = useProviderStore(state => state.deleteProvider)

  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [isBuiltIn, setIsBuiltIn] = useState(false)
  const loadModelsById = useModelStore(state => state.loadModelsById)

  const [models, setModels] = useState<IModelListItem[]>([])

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(ProviderSchema),
    defaultValues: {
      name: '',
      apiKey: '',
      baseUrl: '',
      type: 'custom',
    },
  })

  useEffect(() => {
    const load = async () => {
      if (isEditMode && id) {
        const data = await loadProviderById(id)
        providerForm.reset(data)
        setIsBuiltIn(data.type === 'built-in')
      } else {
        providerForm.reset({
          name: '',
          apiKey: '',
          baseUrl: '',
          type: 'custom',
        })
        setIsBuiltIn(false)
      }

      if (id) {
        const models = await loadModelsById(id)
        if (models) {
          console.log('🔧 模型列表:', models)
          setModels(models)
        }
      }
      setLoading(false)
    }
    load()
  }, [id, isEditMode, loadProviderById, loadModelsById, providerForm])

  const handelDelete = async (modelId: string | number) => {
    if (!window.confirm('确定要删除这个模型吗？')) return

    try {
      // @ts-ignore
      const res = await deleteModelById(modelId)
      console.log('🔧 删除结果:', res)
      toast.success('删除成功')
      if (id) {
        const updatedModels = await loadModelsById(id)
        setModels(updatedModels)
      }
    } catch (e) {
      toast.error('删除异常')
    }
  }

  // 测试连通性
  const handleTest = async () => {
    const values = providerForm.getValues()
    if (!values.baseUrl) {
      toast.error('请填写 Base URL')
      return
    }
    try {
      if (!id) {
        toast.error('请先保存供应商信息')
        return
      }
      setTesting(true)
      await testConnection({
        id,
        api_key: values.apiKey,
        base_url: values.baseUrl
      })

      toast.success('测试连通性成功 🎉')

    } catch (error: any) {
      console.error('连接失败', error)
      const msg = error?.response?.data?.msg || error?.message || '未知错误'
      toast.error(`连接失败: ${msg}`)
    } finally {
      setTesting(false)
    }
  }

  // 保存Provider信息
  const onProviderSubmit = async (values: ProviderFormValues) => {
    try {
      const payload = {
        ...values,
        logo: 'custom',
        enabled: 1
      }

      if (isEditMode && id) {
        // @ts-ignore
        await updateProvider({ ...payload, id })
        toast.success('更新供应商成功')
      } else {
        // @ts-ignore
        const newId = await addNewProvider(payload)
        if (newId) {
          toast.success('新增供应商成功')
          navigate(`/settings/model/${newId}`, { replace: true })
        }
      }
    } catch (error) {
      toast.error('保存失败')
    }
  }

  if (loading) return <div className="p-4">加载中...</div>

  return (
    <div className="flex flex-col gap-8 p-4">
      {/* Provider信息表单 */}
      <Form {...providerForm}>
        <form
          onSubmit={providerForm.handleSubmit(onProviderSubmit)}
          className="flex max-w-xl flex-col gap-4"
        >
          <div className="text-lg font-bold">
            {isEditMode ? '编辑模型供应商' : '新增模型供应商'}
          </div>
          {!isBuiltIn && (
            <div className="text-sm text-red-500 italic">
              自定义模型供应商需要确保兼容 OpenAI SDK
            </div>
          )}
          <FormField
            control={providerForm.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-24 text-right">名称</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isBuiltIn} className="flex-1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={providerForm.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-24 text-right">API Key</FormLabel>
                <FormControl>
                  <Input {...field} className="flex-1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={providerForm.control}
            name="baseUrl"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-24 text-right">API地址</FormLabel>
                <FormControl>
                  <Input {...field} className="flex-1" />
                </FormControl>
                <Button type="button" onClick={handleTest} variant="ghost" disabled={testing}>
                  {testing ? '测试中...' : '测试连通性'}
                </Button>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={providerForm.control}
            name="type"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-24 text-right">类型</FormLabel>
                <FormControl>
                  <Input {...field} disabled className="flex-1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-2 flex gap-4">
            <Button type="submit" disabled={!providerForm.formState.isDirty}>
              {isEditMode ? '保存修改' : '保存创建'}
            </Button>
            {isEditMode && !isBuiltIn && (
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  if (window.confirm('确定要删除此模型供应商吗？这将无法撤销。')) {
                    try {
                      await deleteProvider(id!)
                      toast.success('删除成功')
                      navigate('/settings/model')
                    } catch (e) {
                      toast.error('删除失败')
                    }
                  }
                }}
              >
                删除供应商
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* 模型信息表单 */}
      {id && (
        <div className="flex max-w-xl flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-bold">模型列表</span>
            <div className={'flex flex-col gap-2 rounded bg-[#FEF0F0] p-2.5'}>
              <h2 className={'font-bold'}>注意!</h2>
              <span>请确保已经保存供应商信息,以及通过测试连通性.</span>
            </div>
            <ModelSelector providerId={id} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-bold">已启用模型</span>
            <div className={'flex flex-wrap gap-2 rounded  p-2.5'}>
              {
                models && models.map(model => {
                  return (
                    <Tag onClose={() => {
                      handelDelete(model.id)
                    }} key={model.id} closable color={'blue'}>
                      {model.model_name}
                    </Tag>
                  )
                })
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderForm
