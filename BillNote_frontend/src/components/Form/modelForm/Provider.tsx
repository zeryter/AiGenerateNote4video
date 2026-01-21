import ProviderCard from '@/components/Form/modelForm/components/providerCard.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useProviderStore } from '@/store/providerStore'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const Provider = () => {
  const providers = useProviderStore(state => state.provider)
  const navigate = useNavigate()
  const handleClick = () => {
    navigate(`/settings/model/new`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title and Add Button */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
        <span className="text-sm font-semibold text-muted-foreground">模型供应商</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          title="添加模型供应商"
        >
          <Plus size={18} />
        </Button>
      </div>

      {/* Provider List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {providers &&
          providers.map((provider, index) => {
            return (
              <ProviderCard
                key={index}
                providerName={provider.name}
                Icon={provider.logo}
                id={provider.id}
                enable={provider.enabled}
              />
            )
          })}

        {/* 'Add new' placeholder-like item at bottom if list is empty or just as specific action */}
        {(!providers || providers.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p className="text-xs mb-2">暂无模型</p>
            <Button variant="outline" size="sm" onClick={handleClick}>添加供应商</Button>
          </div>
        )}
      </div>
    </div>
  )
}
export default Provider
