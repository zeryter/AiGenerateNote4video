import { Sparkles, RefreshCw, ChevronDown, Copy, Check, Tag, X, Pencil } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProviderStore } from "@/store/providerStore";
import { useModelStore } from "@/store/modelStore";
import toast from "react-hot-toast";
import { makeVideoKey, useTagStore } from "@/store/tagStore";
import { setVideoTags } from "@/services/tags";
import type { Task } from "@/store/taskStore";

interface WorkspaceHeaderProps {
    task: Task;
    statusInfo: { label: string; color: string };
    onRetry: (providerId: string, modelName: string) => void;
    onCopy: () => void;
    copied: boolean;
}

export default function WorkspaceHeader({ task, statusInfo, onRetry, onCopy, copied }: WorkspaceHeaderProps) {
    const [showRetryOptions, setShowRetryOptions] = useState(false);

    const videoKey = useMemo(() => {
        return makeVideoKey(task?.audioMeta?.platform, task?.audioMeta?.video_id);
    }, [task?.audioMeta?.platform, task?.audioMeta?.video_id]);

    const emptyTagsRef = useRef<string[]>([]);
    const tags = useTagStore((s) => (videoKey ? s.tagsByKey[videoKey] || emptyTagsRef.current : emptyTagsRef.current));
    const setTagsForKey = useTagStore((s) => s.setTagsForKey);
    const [tagInput, setTagInput] = useState("");
    const [editingTags, setEditingTags] = useState(false);
    const saveTimerRef = useRef<number | null>(null);

    const platformForTags = task?.audioMeta?.platform;
    const videoIdForTags = task?.audioMeta?.video_id;
    const statusMessage = typeof task?.statusMessage === "string" ? task.statusMessage.trim() : "";

    const getErrorMessage = (error: unknown) => {
        if (!error) return "标签保存失败";
        if (typeof error === "string") return error;
        if (error instanceof Error && error.message) return error.message;
        if (typeof error === "object") {
            const message = "message" in error ? (error as { message?: string }).message : undefined;
            const msg = "msg" in error ? (error as { msg?: string }).msg : undefined;
            return msg || message || "标签保存失败";
        }
        return "标签保存失败";
    };

    const scheduleSaveTags = (nextTags: string[]) => {
        if (!platformForTags || !videoIdForTags) return;
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(async () => {
            try {
                await setVideoTags(platformForTags, videoIdForTags, nextTags);
            } catch (error: unknown) {
                toast.error(getErrorMessage(error));
            }
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        };
    }, []);

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

    const handleAddTag = () => {
        const cleaned = tagInput.trim();
        if (!cleaned || !videoKey) return;
        const next = tags.includes(cleaned) ? tags : [...tags, cleaned];
        setTagsForKey(videoKey, next);
        scheduleSaveTags(next);
        setTagInput("");
    };

    const handleRemoveTag = (t: string) => {
        if (!videoKey) return;
        const next = tags.filter((x) => x !== t);
        setTagsForKey(videoKey, next);
        scheduleSaveTags(next);
    };

    return (
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/50 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Sparkles size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate max-w-[300px]">
                        {task.audioMeta?.title || "BiliNote Workspace"}
                    </span>
                    <span className={`text-xs ${statusInfo.color}`}>阶段：{statusInfo.label}</span>
                    {statusMessage && (
                        <span className={`text-xs ${task.status === "FAILED" ? "text-red-400" : "text-muted-foreground"}`}>
                            {statusMessage}
                        </span>
                    )}
                </div>
                {videoKey && (
                    <div className="flex items-center gap-2 ml-2 min-w-0 max-w-[40vw] overflow-x-auto">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Tag size={14} />
                        </div>
                        <div className="flex items-center gap-1 min-w-0 flex-wrap">
                            {tags.slice(0, 4).map((t) => (
                                <span
                                    key={t}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/50 bg-card/30 text-xs text-foreground/80"
                                >
                                    <span className="truncate max-w-[120px]">{t}</span>
                                    {editingTags && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(t)}
                                            className="text-muted-foreground hover:text-foreground"
                                            aria-label="删除标签"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </span>
                            ))}
                            {tags.length > 4 && (
                                <span className="text-xs text-muted-foreground">+{tags.length - 4}</span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditingTags((v) => !v)}
                            className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0"
                            title={editingTags ? "完成" : "编辑标签"}
                        >
                            <Pencil size={14} />
                        </button>
                        {editingTags && (
                            <div className="flex items-center gap-1">
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    placeholder="添加标签"
                                    className="w-28 h-7 px-2 rounded-lg bg-card/50 border border-border/50 text-xs focus:outline-none focus:border-primary/50"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="h-7 px-2 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90"
                                >
                                    添加
                                </button>
                            </div>
                        )}
                    </div>
                )}
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
