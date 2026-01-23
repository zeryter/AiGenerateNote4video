import { ArrowUpDown, ChevronDown, ChevronUp, ListVideo, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCoverUrl } from "@/utils/mediaHelper";
import type { Task } from "@/store/taskStore";
import { usePlaylistStore } from "@/store/playlistStore";

interface PlaylistPanelProps {
    currentTask: Task;
    onSelectTask: (taskId: string) => void;
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

    return (
        <div className={`bg-card/30 rounded-xl border border-border/50 backdrop-blur-sm flex flex-col overflow-hidden ${collapsed ? "h-12" : "h-40"}`}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <ListVideo size={14} />
                    播放列表
                </div>
                <div className="flex items-center gap-2">
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
                </div>
            </div>
            {!collapsed && (
                <div className="flex-1 overflow-auto px-2 py-2">
                    {items.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                            暂无播放列表
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {items.map((item) => (
                                <div
                                    key={item.taskId}
                                    className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-xs transition-colors ${item.taskId === currentTask.id ? "border-primary/40 bg-primary/10" : "border-border/50 hover:bg-muted/40"}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSelectTask(item.taskId)}
                                        className="flex items-center gap-2 flex-1 min-w-0"
                                    >
                                        {item.coverUrl ? (
                                            <img
                                                src={getCoverUrl(item.coverUrl)}
                                                alt={item.title}
                                                className="h-6 w-8 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="h-6 w-8 rounded bg-muted" />
                                        )}
                                        <span className="truncate">{item.title}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeTask(item.taskId)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
