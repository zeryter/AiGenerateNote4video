import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Trash2, Youtube, Play, FileVideo, Calendar, Search, Tag, ArrowUpDown, CheckSquare, Square, Plus, RefreshCw } from "lucide-react";
import { useTaskStore, type Task } from "@/store/taskStore";
import { EmptyState } from "@/components/ui/empty-state";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { makeVideoKey, useTagStore } from "@/store/tagStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { setVideoTags } from "@/services/tags";
import { statusMap } from "@/constant/status";

// Helper to get platform icon
function PlatformIcon({ platform }: { platform: string }) {
    switch (platform) {
        case "bilibili":
            return <div className="text-pink-400 font-bold text-xs">Bili</div>; // Simple text if icon not avail
        case "youtube":
            return <Youtube size={16} className="text-red-500" />;
        case "local":
            return <FileVideo size={16} className="text-blue-500" />;
        default:
            return <Play size={16} className="text-muted-foreground" />;
    }
}

// Helper to format date
function formatDate(dateStr: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    });
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const tasks = useTaskStore((s) => s.tasks);
    const removeTask = useTaskStore((s) => s.removeTask);
    const fetchTasks = useTaskStore((s) => s.fetchTasks);
    const [searchTerm, setSearchTerm] = useState("");
    const tagsByKey = useTagStore((s) => s.tagsByKey);
    const addTasksToPlaylist = usePlaylistStore((s) => s.addTasks);
    const replacePlaylist = usePlaylistStore((s) => s.replaceWithTasks);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const setTagsForKey = useTagStore((s) => s.setTagsForKey);
    const [batchTagInput, setBatchTagInput] = useState("");
    const [batchSaving, setBatchSaving] = useState(false);
    const PAGE_SIZE = 50;
    const [currentPage, setCurrentPage] = useState(1);

    const SORT_KEY = "history_sort_v1";
    const FILTER_KEY = "history_tag_filters_v1";
    type SortOption =
        | "created_desc"
        | "created_asc"
        | "status_in_progress_first"
        | "status_success_first"
        | "status_failed_first"
        | "title_asc"
        | "title_desc";

    const [sortOption, setSortOption] = useState<SortOption>(() => {
        const v = localStorage.getItem(SORT_KEY) as SortOption | null;
        return v || "created_desc";
    });
    const [selectedTags, setSelectedTags] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem(FILTER_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
        } catch {
            return [];
        }
    });

    // Sync tasks on mount
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    useEffect(() => {
        localStorage.setItem(SORT_KEY, sortOption);
    }, [sortOption]);

    useEffect(() => {
        localStorage.setItem(FILTER_KEY, JSON.stringify(selectedTags));
    }, [selectedTags]);

    const getTaskTags = useCallback((task: Task): string[] => {
        const platform = task?.audioMeta?.platform || task?.platform || task?.formData?.platform;
        const videoId = task?.audioMeta?.video_id;
        const key = makeVideoKey(platform, videoId);
        if (key && Array.isArray(tagsByKey[key])) return tagsByKey[key];
        return Array.isArray(task?.tags) ? (task.tags as string[]) : [];
    }, [tagsByKey]);

    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        for (const t of tasks) {
            const uniq = new Set(getTaskTags(t));
            for (const tag of uniq) {
                counts.set(tag, (counts.get(tag) || 0) + 1);
            }
        }
        const items = Array.from(counts.entries()).map(([tag, count]) => ({ tag, count }));
        items.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
        return items;
    }, [tasks, getTaskTags]);

    const filteredTasks = tasks.filter((task) => {
        const title = task.audioMeta?.title || "";
        const url = task.formData?.video_url || "";
        const query = searchTerm.toLowerCase();
        const matchesQuery = title.toLowerCase().includes(query) || url.toLowerCase().includes(query);
        if (!matchesQuery) return false;
        if (selectedTags.length === 0) return true;
        const taskTags = getTaskTags(task);
        return selectedTags.every((t) => taskTags.includes(t));
    });

    const statusRank = useCallback((status: string, mode: SortOption) => {
        const isQueued = status === "PENDING" || status === "QUEUED";
        if (mode === "status_in_progress_first") return isQueued ? 0 : status === "SUCCESS" ? 1 : 2;
        if (mode === "status_success_first") return status === "SUCCESS" ? 0 : isQueued ? 1 : 2;
        if (mode === "status_failed_first") return status === "FAILED" ? 0 : isQueued ? 1 : 2;
        return 0;
    }, []);

    const sortedTasks = useMemo(() => {
        const list = [...filteredTasks];
        list.sort((a, b) => {
            if (sortOption === "created_desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortOption === "created_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortOption.startsWith("status_")) {
                const ra = statusRank(a.status, sortOption);
                const rb = statusRank(b.status, sortOption);
                if (ra !== rb) return ra - rb;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortOption === "title_asc") {
                const ta = (a.audioMeta?.title || "").localeCompare(b.audioMeta?.title || "");
                if (ta !== 0) return ta;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortOption === "title_desc") {
                const ta = (b.audioMeta?.title || "").localeCompare(a.audioMeta?.title || "");
                if (ta !== 0) return ta;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return list;
    }, [filteredTasks, sortOption, statusRank]);
    const totalPages = Math.max(1, Math.ceil(sortedTasks.length / PAGE_SIZE));
    const pagedTasks = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedTasks.slice(start, start + PAGE_SIZE);
    }, [sortedTasks, currentPage]);
    const selectedTasks = useMemo(() => {
        const map = new Map(tasks.map((t) => [t.id, t]));
        return selectedIds.map((id) => map.get(id)).filter((t): t is Task => Boolean(t));
    }, [selectedIds, tasks]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedTags, sortOption, tasks.length]);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("确定要删除这条记录吗？")) {
            removeTask(id);
            toast.success("已删除");
        }
    };
    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    const selectAllVisible = () => {
        setSelectedIds(pagedTasks.map((t) => t.id));
    };
    const clearSelection = () => {
        setSelectedIds([]);
    };
    const handleAddToPlaylist = () => {
        if (selectedTasks.length === 0) return;
        addTasksToPlaylist(selectedTasks);
        toast.success(`已加入 ${selectedTasks.length} 条`);
        clearSelection();
    };
    const handleReplacePlaylist = () => {
        if (selectedTasks.length === 0) return;
        replacePlaylist(selectedTasks);
        toast.success(`已替换为 ${selectedTasks.length} 条`);
        clearSelection();
    };
    const parseTagsInput = (input: string) =>
        input
            .split(/[,，\n]/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
    const handleBatchAddTags = async () => {
        if (batchSaving) return;
        const parsed = parseTagsInput(batchTagInput);
        if (parsed.length === 0) {
            toast.error("请输入标签");
            return;
        }
        const updates = selectedTasks
            .map((task) => {
                const platform = task?.audioMeta?.platform || task?.platform || task?.formData?.platform;
                const videoId = task?.audioMeta?.video_id;
                const key = makeVideoKey(platform, videoId);
                if (!key || !platform || !videoId) return null;
                const current = getTaskTags(task);
                const next = Array.from(new Set([...current, ...parsed]));
                setTagsForKey(key, next);
                return { platform, videoId, next };
            })
            .filter((item): item is { platform: string; videoId: string; next: string[] } => Boolean(item));
        if (updates.length === 0) {
            toast.error("没有可更新的任务");
            return;
        }
        setBatchSaving(true);
        const results = await Promise.allSettled(
            updates.map((u) => setVideoTags(u.platform, u.videoId, u.next))
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
            toast.error(`有 ${failed} 条保存失败`);
        } else {
            toast.success(`已添加标签到 ${updates.length} 条`);
        }
        setBatchSaving(false);
        setBatchTagInput("");
    };

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/")}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            历史记录
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            共 {tasks.length} 条记录
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="appearance-none pl-9 pr-3 py-2 bg-card/50 border border-border/50 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm cursor-pointer"
                        >
                            <option value="created_desc">最新优先</option>
                            <option value="created_asc">最早优先</option>
                            <option value="status_in_progress_first">排队中优先</option>
                            <option value="status_success_first">已完成优先</option>
                            <option value="status_failed_first">失败优先</option>
                            <option value="title_asc">标题 A-Z</option>
                            <option value="title_desc">标题 Z-A</option>
                        </select>
                    </div>
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="搜索历史..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card/50 border border-border/50 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>
            </header>

            <div className="mb-6 flex items-start gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/30 border border-border/50 text-sm text-muted-foreground shrink-0">
                    <Tag size={14} />
                    <span>标签筛选</span>
                </div>
                <div className="flex-1 flex flex-wrap gap-2">
                    {tagStats.length === 0 ? (
                        <span className="text-sm text-muted-foreground/70 py-2">暂无标签</span>
                    ) : (
                        <>
                            {tagStats.slice(0, 20).map(({ tag, count }) => {
                                const active = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTags((prev) => {
                                                if (prev.includes(tag)) return prev.filter((t) => t !== tag);
                                                return [...prev, tag];
                                            });
                                        }}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs transition-colors ${active
                                            ? "bg-primary/15 text-primary border-primary/30"
                                            : "bg-card/30 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                                            }`}
                                        title={`${count} 条`}
                                    >
                                        <span className="max-w-[140px] truncate">{tag}</span>
                                        <span className="opacity-70">({count})</span>
                                    </button>
                                );
                            })}
                            {selectedTags.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedTags([])}
                                    className="px-3 py-1 rounded-full border border-border/50 bg-card/30 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                                >
                                    清空
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                    已选择 {selectedIds.length} 条
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {selectedIds.length > 0 && (
                        <>
                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border/50 bg-card/40">
                                <Tag size={12} className="text-muted-foreground" />
                                <input
                                    value={batchTagInput}
                                    onChange={(e) => setBatchTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleBatchAddTags();
                                        }
                                    }}
                                    placeholder="标签(逗号分隔)"
                                    className="w-28 h-7 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleBatchAddTags}
                                    disabled={batchSaving}
                                    className={`h-7 px-2 rounded-md text-xs ${batchSaving ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                                >
                                    添加
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddToPlaylist}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 bg-card/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                                <Plus size={12} />
                                加入播放列表
                            </button>
                            <button
                                type="button"
                                onClick={handleReplacePlaylist}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 bg-card/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                                <RefreshCw size={12} />
                                替换播放列表
                            </button>
                            <button
                                type="button"
                                onClick={clearSelection}
                                className="px-3 py-1.5 rounded-lg border border-border/50 bg-card/30 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                                清空选择
                            </button>
                        </>
                    )}
                    {sortedTasks.length > 0 && (
                        <button
                            type="button"
                            onClick={selectAllVisible}
                            className="px-3 py-1.5 rounded-lg border border-border/50 bg-card/30 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                        >
                            全选当前
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {sortedTasks.length === 0 ? (
                    <EmptyState
                        icon={<Clock size={48} className="text-muted-foreground/70" />}
                        title="没有找到相关记录"
                        description="换个关键词或清空筛选试试"
                        className="py-20"
                    />
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
                        <AnimatePresence>
                            {pagedTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => navigate(`/workspace?taskId=${task.id}`, { state: { from: '/history' } })}
                                    className={`group relative bg-card/40 hover:bg-card/80 border border-border/50 hover:border-primary/30 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden break-inside-avoid mb-4 ${selectedIds.includes(task.id) ? "ring-1 ring-primary/40" : ""}`}
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelected(task.id);
                                        }}
                                        className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground"
                                    >
                                        {selectedIds.includes(task.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                                    </button>
                                    <div className="flex gap-4">
                                        {/* Thumbnail / Icon */}
                                        <div className="w-20 h-20 rounded-lg bg-black/50 border border-border/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {task.audioMeta?.cover_url ? (
                                                <img
                                                    src={task.audioMeta.cover_url.startsWith('http') ? `/api/image_proxy?url=${encodeURIComponent(task.audioMeta.cover_url)}` : task.audioMeta.cover_url}
                                                    alt="cover"
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <PlatformIcon platform={task.platform || task.formData.platform} />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${task.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        task.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            (task.status === 'QUEUED' || task.status === 'PENDING') ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        }`}>
                                                        {(statusMap[task.status] || statusMap.PENDING).label}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <Calendar size={10} />
                                                        <span>{formatDate(task.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-medium text-sm mt-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                    {task.audioMeta?.title || "未命名任务"}
                                                </h3>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <PlatformIcon platform={task.platform || task.formData.platform} />
                                                    <span className="opacity-70 capitalize">{task.platform || task.formData.platform || "Unknown"}</span>
                                                </div>
                                            </div>
                                            {getTaskTags(task).length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {getTaskTags(task).slice(0, 4).map((t: string) => (
                                                        <span
                                                            key={t}
                                                            className="px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-[10px] font-medium text-primary/90"
                                                        >
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete Button (Hover only) */}
                                    <button
                                        onClick={(e) => handleDelete(e, task.id)}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                        title="删除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            {sortedTasks.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        第 {currentPage} / {totalPages} 页 · 每页 {PAGE_SIZE} 条
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1.5 rounded-lg border border-border/50 bg-card/30 text-xs text-muted-foreground disabled:opacity-50"
                        >
                            上一页
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 rounded-lg border border-border/50 bg-card/30 text-xs text-muted-foreground disabled:opacity-50"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
