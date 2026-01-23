import { Switch } from '@/components/ui/switch'
import { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AILogo from '@/components/Form/modelForm/Icons'
import { useProviderStore } from '@/store/providerStore'
import { cn } from '@/lib/utils'

export interface IProviderCardProps {
  id: string
  providerName: string
  Icon: string
  enable: number
}

const ProviderCard: FC<IProviderCardProps> = ({
  providerName,
  Icon,
  id,
  enable,
}: IProviderCardProps) => {
  const navigate = useNavigate()
  // Split selectors to avoid object identity issues triggering infinite loops in useSyncExternalStore
  const updateProvider = useProviderStore(state => state.updateProvider)
  const providers = useProviderStore(state => state.provider)

  const handleClick = () => {
    navigate(`/settings/model/${id}`)
  }

  const handleToggle = async (checked: boolean) => {
    // Find the full provider object
    const currentProvider = providers.find(p => String(p.id) === id)

    if (currentProvider) {
      await updateProvider({
        ...currentProvider,
        enabled: checked ? 1 : 0,
      })
    }
  }

  const { id: currentId } = useParams<{ id: string }>()
  const isActive = currentId === id

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all cursor-pointer border border-transparent",
        isActive
          ? "bg-primary/10 text-primary font-medium border-primary/20 shadow-sm"
          : "text-foreground/80 hover:bg-accent hover:text-foreground hover:border-border/50"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex h-7 w-7 items-center flex-shrink-0 justify-center rounded-md bg-background/50 border border-border/20 shadow-sm p-1">
          <AILogo name={Icon} />
        </div>
        <div className="truncate text-sm font-medium">{providerName}</div>
      </div>

      <div
        className="flex-shrink-0 ml-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Switch
          checked={enable === 1}
          onCheckedChange={handleToggle}
          className="scale-75 data-[state=checked]:bg-primary"
        />
      </div>
    </div>
  )
}
export default ProviderCard
