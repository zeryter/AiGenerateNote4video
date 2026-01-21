import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Trash2, Youtube, Play, FileVideo, Calendar, Search } from "lucide-react";
import { useTaskStore } from "@/store/taskStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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

    // Sync tasks on mount
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const filteredTasks = tasks.filter((task) => {
        const title = task.audioMeta?.title || "";
        const url = task.formData?.video_url || "";
        const query = searchTerm.toLowerCase();
        return title.toLowerCase().includes(query) || url.toLowerCase().includes(query);
    });

    // Sort by createdAt desc
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("确定要删除这条记录吗？")) {
            removeTask(id);
            toast.success("已删除");
        }
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
            </header>

            {/* List */}
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {sortedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-60">
                        <Clock size={48} className="mb-4" />
                        <p>没有找到相关记录</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {sortedTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => navigate(`/workspace?taskId=${task.id}`, { state: { from: '/history' } })}
                                    className="group relative bg-card/40 hover:bg-card/80 border border-border/50 hover:border-primary/30 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                                >
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
                                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                        }`}>
                                                        {task.status === 'SUCCESS' ? '已完成' : task.status === 'FAILED' ? '失败' : '进行中'}
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
        </div>
    );
}
