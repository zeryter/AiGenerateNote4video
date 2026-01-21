import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, RefreshCw, ChevronDown, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useProviderStore } from "@/store/providerStore";
import { useModelStore } from "@/store/modelStore";

interface WorkspaceHeaderProps {
    task: any;
    statusInfo: { label: string; color: string };
    onRetry: (providerId: string, modelName: string) => void;
    onCopy: () => void;
    copied: boolean;
}

export default function WorkspaceHeader({ task, statusInfo, onRetry, onCopy, copied }: WorkspaceHeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const backPath = location.state?.from || "/";
    const [showRetryOptions, setShowRetryOptions] = useState(false);

    // Provider/Model stores for retry
    const providers = useProviderStore((s) => s.provider);
    const modelList = useModelStore((s) => s.modelList);

    // Local state for selections
    const enabledProviders = providers.filter((p) => p.enabled);
    const [retryProviderId, setRetryProviderId] = useState<string | null>(null);
    const [retryModelName, setRetryModelName] = useState<string | null>(null);

    const selectedRetryProvider = enabledProviders.find((p) => String(p.id) === retryProviderId) || enabledProviders[0];
    const modelsForProvider = modelList.filter((m) => m.provider_id === String(selectedRetryProvider?.id));
    const selectedRetryModel = modelsForProvider.find((m) => m.model_name === retryModelName) || modelsForProvider[0];

    const handleRetryClick = () => {
        if (showRetryOptions) {
            if (selectedRetryProvider && selectedRetryModel) {
                onRetry(String(selectedRetryProvider.id), selectedRetryModel.model_name);
                setShowRetryOptions(false);
            }
        } else {
            setShowRetryOptions(true);
        }
    };

    return (
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/50 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(backPath)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft size={18} className="text-muted-foreground" />
                </button>
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Sparkles size={18} />
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm truncate max-w-[300px]">
                        {task.audioMeta?.title || "BiliNote Workspace"}
                    </span>
                    <span className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {task.status === "FAILED" && (
                    <div className="flex items-center gap-2">
                        {showRetryOptions && (
                            <>
                                <div className="relative">
                                    <select
                                        value={retryProviderId || selectedRetryProvider?.id?.toString() || ""}
                                        onChange={(e) => {
                                            setRetryProviderId(e.target.value);
                                            setRetryModelName(null);
                                        }}
                                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg bg-card border border-border/50 text-xs focus:outline-none focus:border-primary"
                                    >
                                        {enabledProviders.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={retryModelName || selectedRetryModel?.model_name || ""}
                                        onChange={(e) => setRetryModelName(e.target.value)}
                                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg bg-card border border-border/50 text-xs focus:outline-none focus:border-primary max-w-[150px]"
                                    >
                                        {modelsForProvider.map((m) => (
                                            <option key={m.model_name} value={m.model_name}>{m.model_name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                            </>
                        )}
                        <button
                            onClick={handleRetryClick}
                            className="p-2 hover:bg-muted rounded-full transition-colors flex items-center gap-1"
                            title={showRetryOptions ? "确认重试" : "重试"}
                        >
                            <RefreshCw size={18} className={showRetryOptions ? "text-primary" : "text-muted-foreground"} />
                            {showRetryOptions && <span className="text-xs text-primary">重试</span>}
                        </button>
                    </div>
                )}
                <button onClick={onCopy} className="p-2 hover:bg-muted rounded-full transition-colors" title="复制笔记">
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-muted-foreground" />}
                </button>
                <button className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    导出
                </button>
            </div>
        </header>
    );
}
