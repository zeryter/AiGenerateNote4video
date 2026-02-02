import { ArrowUpDown, ChevronDown, ChevronUp, ListVideo, Plus, Trash2, FileText, Save, FolderOpen, Play, Edit2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCoverUrl } from "@/utils/mediaHelper";
import { useTaskStore, type Task } from "@/store/taskStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { useDescriptionStore } from "@/store/descriptionStore";
import { Tooltip } from "antd";
import DescriptionEditor from "@/components/DescriptionEditor";
import toast from "react-hot-toast";

interface PlaylistPanelProps {
    currentTask: Task;
    onSelectTask: (taskId: string) => void;
}

// Helper function to format duration in seconds to HH:MM:SS or MM:SS
function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function PlaylistPanel({ currentTask, onSelectTask }: PlaylistPanelProps) {
    const items = usePlaylistStore((s) => s.items);
    const addTask = usePlaylistStore((s) => s.addTask);
    const removeTask = usePlaylistStore((s) => s.removeTask);
    const clear = usePlaylistStore((s) => s.clear);
    const sortByName = usePlaylistStore((s) => s.sortByName);
    const sortByCreatedAt = usePlaylistStore((s) => s.sortByCreatedAt);
    const isInPlaylist = items.some((item) => item.taskId === currentTask.id);
    const [collapsed, setCollapsed] = useState(false);
    const [sortOrder, setSortOrder] = useState<"default" | "name_asc" | "name_desc">("default");

    const savedPlaylists = usePlaylistStore((s) => s.savedPlaylists);
    const savePlaylist = usePlaylistStore((s) => s.savePlaylist);
    const removePlaylist = usePlaylistStore((s) => s.removePlaylist);
    const loadPlaylist = usePlaylistStore((s) => s.loadPlaylist);
    const renamePlaylist = usePlaylistStore((s) => s.renamePlaylist);

    const allTasks = useTaskStore((s) => s.tasks);
    // Description feature
    const { getDescription, setDescription } = useDescriptionStore();
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const editingItem = items.find((item) => item.taskId === editingTaskId);

    // Playlist Management
    const [viewMode, setViewMode] = useState<"current" | "saved">("current");
    const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
    const [tempPlaylistName, setTempPlaylistName] = useState("");

    const handleSavePlaylist = () => {
        const name = prompt("请输入歌单名称：", `歌单 ${new Date().toLocaleDateString()}`);
        if (name) {
            savePlaylist(name, currentTask.id);
            toast.success("歌单已保存");
        }
    };

    useEffect(() => {
        if (items.length === 0) return;
        if (sortOrder === "name_asc") sortByName("asc");
        if (sortOrder === "name_desc") sortByName("desc");
    }, [items.length, sortByName, sortOrder]);

    const handleSortChange = (order: "default" | "name_asc" | "name_desc") => {
        setSortOrder(order);
        if (order === "name_asc") sortByName("asc");
        if (order === "name_desc") sortByName("desc");
        if (order === "default") sortByCreatedAt("desc");
    };

    // Calculate total duration using latest task info
    const totalDuration = items.reduce((sum, item) => {
        const task = allTasks.find(t => t.id === item.taskId);
        const duration = task?.audioMeta?.duration || item.duration || 0;
        return sum + duration;
    }, 0);
    const validItemsCount = items.filter(item => !item.isDeleted).length;

    // Debug: log duration info
    useEffect(() => {
        console.log('Duration Debug:', items.map(item => {
            const task = allTasks.find(t => t.id === item.taskId);
            return {
                title: item.title,
                playlistDuration: item.duration,
                taskDuration: task?.audioMeta?.duration,
                final: task?.audioMeta?.duration || item.duration || 0
            };
        }));
    }, [items, allTasks]);

    return (
        <>
            <div className={`bg-card/30 rounded-xl border border-border/50 backdrop-blur-sm flex flex-col overflow-hidden ${collapsed ? "h-12" : "h-40"}`}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            {viewMode === "current" ? <ListVideo size={14} /> : <FolderOpen size={14} />}
                            <span>{viewMode === "current" ? "播放列表" : "我的歌单"}</span>
                        </div>
                        {viewMode === "current" && validItemsCount > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>·</span>
                                <span>{validItemsCount} 首</span>
                                <span>·</span>
                                <span>{formatDuration(totalDuration)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Switcher */}
                        <button
                            type="button"
                            onClick={() => setViewMode(viewMode === "current" ? "saved" : "current")}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title={viewMode === "current" ? "查看我的歌单" : "返回当前播放列表"}
                        >
                            {viewMode === "current" ? <FolderOpen size={12} /> : <ListVideo size={12} />}
                        </button>

                        {viewMode === "current" && (
                            <>
                                {!collapsed && items.length > 1 && (
                                    <div className="relative">
                                        <ArrowUpDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => handleSortChange(e.target.value as "default" | "name_asc" | "name_desc")}
                                            className="appearance-none pl-6 pr-2 py-1 rounded-md border border-border/50 bg-card/50 text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            <option value="default">默认</option>
                                            <option value="name_asc">名称 A-Z</option>
                                            <option value="name_desc">名称 Z-A</option>
                                        </select>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setCollapsed((prev) => !prev)}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                >
                                    {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                    {collapsed ? "展开" : "收起"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSavePlaylist}
                                    disabled={items.length === 0}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                                    title="保存为歌单"
                                >
                                    <Save size={12} />
                                    保存
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addTask(currentTask)}
                                    disabled={isInPlaylist}
                                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${isInPlaylist ? "bg-muted/50 text-muted-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                                >
                                    <Plus size={12} />
                                    {isInPlaylist ? "已加入" : "加入"}
                                </button>
                                {items.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clear}
                                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        清空
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
                {!collapsed && (
                    <div className="flex-1 overflow-auto px-2 py-2">
                        {viewMode === "current" ? (
                            items.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                    暂无播放列表
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {items.map((item) => (
                                        <div
                                            key={item.taskId}
                                            className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-xs transition-colors ${item.isDeleted ? "border-red-500/20 bg-red-500/5 opacity-70" : item.taskId === currentTask.id ? "border-primary/40 bg-primary/10" : "border-border/50 hover:bg-muted/40"}`}
                                        >
                                            <Tooltip
                                                title={getDescription(item.taskId) || null}
                                                placement="top"
                                                overlayStyle={{ maxWidth: 250 }}
                                                overlayInnerStyle={{ whiteSpace: 'pre-wrap', fontSize: '11px', padding: '6px 10px' }}
                                            >
                                                <button
                                                    type="button"
                                                    disabled={!!item.isDeleted}
                                                    onClick={() => !item.isDeleted && onSelectTask(item.taskId)}
                                                    className="flex items-center gap-2 flex-1 min-w-0 disabled:cursor-not-allowed"
                                                >
                                                    {!item.isDeleted && item.coverUrl ? (
                                                        <img
                                                            src={getCoverUrl(item.coverUrl)}
                                                            alt={item.title}
                                                            className="h-6 w-8 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-6 w-8 rounded bg-muted flex items-center justify-center">
                                                            {item.isDeleted && <Trash2 size={10} className="text-red-500" />}
                                                        </div>
                                                    )}
                                                    <span className={`truncate flex items-center gap-1 ${item.isDeleted ? "text-red-500 line-through" : ""}`}>
                                                        {getDescription(item.taskId) && <FileText size={10} className="text-primary/70 flex-shrink-0" />}
                                                        {item.title}
                                                    </span>
                                                </button>
                                            </Tooltip>
                                            {!item.isDeleted && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingTaskId(item.taskId)}
                                                    className="text-muted-foreground hover:text-primary p-0.5"
                                                    title="编辑说明"
                                                >
                                                    <FileText size={12} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeTask(item.taskId)}
                                                className="text-muted-foreground hover:text-foreground p-0.5"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            // Saved Playlists View
                            savedPlaylists.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                    暂无保存的歌单
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {savedPlaylists.map(playlist => (
                                        <div key={playlist.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/10 px-3 py-2 text-xs hover:bg-muted/20">
                                            <div className="flex-1 min-w-0">
                                                {editingPlaylistId === playlist.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            autoFocus
                                                            value={tempPlaylistName}
                                                            onChange={e => setTempPlaylistName(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === "Enter") {
                                                                    renamePlaylist(playlist.id, tempPlaylistName);
                                                                    setEditingPlaylistId(null);
                                                                }
                                                                if (e.key === "Escape") setEditingPlaylistId(null);
                                                            }}
                                                            className="w-full bg-background border border-primary/50 rounded px-1 min-w-0"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                renamePlaylist(playlist.id, tempPlaylistName);
                                                                setEditingPlaylistId(null);
                                                            }}
                                                            className="text-green-500"
                                                        >
                                                            <Save size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium truncate">{playlist.name}</span>
                                                        <span className="text-[10px] text-muted-foreground/70">{playlist.items.length} 首 · {new Date(playlist.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        const lastTaskId = loadPlaylist(playlist.id);
                                                        setViewMode("current");
                                                        if (lastTaskId) {
                                                            onSelectTask(lastTaskId);
                                                        } else if (playlist.items && playlist.items.length > 0) {
                                                            onSelectTask(playlist.items[0].taskId);
                                                        }
                                                        toast.success("已加载歌单");
                                                    }}
                                                    className="p-1 hover:text-primary transition-colors"
                                                    title="加载歌单"
                                                >
                                                    <Play size={12} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingPlaylistId(playlist.id);
                                                        setTempPlaylistName(playlist.name);
                                                    }}
                                                    className="p-1 hover:text-primary transition-colors"
                                                    title="重命名"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("确定要删除这个歌单吗？")) {
                                                            removePlaylist(playlist.id);
                                                        }
                                                    }}
                                                    className="p-1 hover:text-red-500 transition-colors"
                                                    title="删除"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Description Editor Modal */}
            <DescriptionEditor
                isOpen={!!editingTaskId}
                onClose={() => setEditingTaskId(null)}
                title={editingItem?.title || "未命名任务"}
                initialValue={editingTaskId ? getDescription(editingTaskId) : ""}
                onSave={(description) => {
                    if (editingTaskId) {
                        setDescription(editingTaskId, description);
                        toast.success(description ? "说明已保存" : "说明已清除");
                    }
                }}
            />
        </>
    );
}
